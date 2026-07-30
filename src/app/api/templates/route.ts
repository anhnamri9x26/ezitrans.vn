import { NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';
import { TemplateStatus, TemplateType } from '@prisma/client';
import { getCurrentUser } from '@/lib/session';
import { userCan } from '@/lib/capabilities';

// Helper to validate and convert numbers
const parseId = (val: any) => {
  if (val === undefined || val === null) return undefined;
  const num = Number(val);
  return isNaN(num) ? undefined : num;
};

function hasOverlappingConditions(condsA: any[], condsB: any[]): boolean {
  if (condsA.length === 0 && condsB.length === 0) return true;
  return condsA.some(cA => {
    return condsB.some(cB => {
      return cA.conditionType === cB.conditionType &&
             cA.targetType === cB.targetType &&
             cA.targetId === cB.targetId &&
             cA.targetSlug === cB.targetSlug;
    });
  });
}

export async function GET(req: Request) {
  try {
    const user = await getCurrentUser();
    const hasCap = await userCan(user, 'manage_templates');
    if (!hasCap) {
      return NextResponse.json({ success: false, error: 'Bạn không có quyền quản lý templates' }, { status: 403 });
    }
    const { searchParams } = new URL(req.url);
    const idParam = searchParams.get('id');
    const typeParam = searchParams.get('type');
    const statusParam = searchParams.get('status');

    if (idParam) {
      const template = await prisma.template.findUnique({
        where: { id: Number(idParam) },
        include: {
          conditions: true,
        },
      });
      if (!template) {
        return NextResponse.json({ success: false, error: 'Không tìm thấy template' }, { status: 404 });
      }
      return NextResponse.json({ success: true, template });
    }

    const templates = await prisma.template.findMany({
      where: {
        type: typeParam ? (typeParam as TemplateType) : undefined,
        status: statusParam ? (statusParam as TemplateStatus) : undefined,
      },
      include: {
        conditions: true,
      },
      orderBy: [
        { type: 'asc' },
        { id: 'asc' },
      ],
    });

    return NextResponse.json({ success: true, templates });
  } catch (error: any) {
    console.error('Error fetching templates:', error);
    return NextResponse.json(
      { success: false, error: error.message || 'Internal Server Error' },
      { status: 500 }
    );
  }
}

export async function POST(req: Request) {
  try {
    const user = await getCurrentUser();
    const hasCap = await userCan(user, 'manage_templates');
    if (!hasCap) {
      return NextResponse.json({ success: false, error: 'Bạn không có quyền quản lý templates' }, { status: 403 });
    }
    const body = await req.json();
    const {
      action,
      id,
      name,
      type,
      status,
      componentFile,
      htmlContent,
      cssContent,
      builderData,
      isDefault,
      priority,
      conditions,
      commitMessage,
      revisionName,
      isStarred,
    } = body;

    // 1. Create a new template
    if (action === 'create') {
      if (!name || !type) {
        return NextResponse.json(
          { success: false, error: 'Thiếu thông tin bắt buộc (name, type)' },
          { status: 400 }
        );
      }

      const template = await prisma.$transaction(async (tx) => {
        const newTemplate = await tx.template.create({
          data: {
            name,
            type: type as TemplateType,
            status: (status as TemplateStatus) || 'INACTIVE',
            componentFile: componentFile || null,
            htmlContent: htmlContent || null,
            cssContent: cssContent || null,
            builderData: builderData || null,
            isDefault: false,
            priority: priority !== undefined ? Number(priority) : 10,
          },
        });

        if (Array.isArray(conditions) && conditions.length > 0) {
          await tx.templateCondition.createMany({
            data: conditions.map((cond: any) => ({
              templateId: newTemplate.id,
              conditionType: cond.conditionType, // 'INCLUDE' | 'EXCLUDE'
              targetType: cond.targetType,
              targetId: cond.targetId ? Number(cond.targetId) : null,
              targetSlug: cond.targetSlug || null,
            })),
          });
        }

        const finalTemplate = await tx.template.findUnique({
          where: { id: newTemplate.id },
          include: { conditions: true },
        });

        let warningMsg = '';
        if (finalTemplate && finalTemplate.status === 'ACTIVE') {
          const activeTemplates = await tx.template.findMany({
            where: {
              type: finalTemplate.type,
              status: 'ACTIVE',
              NOT: { id: finalTemplate.id }
            },
            include: { conditions: true }
          });

          const deactivatedNames: string[] = [];
          for (const other of activeTemplates) {
            const hasConflict = hasOverlappingConditions(finalTemplate.conditions, other.conditions);
            if (hasConflict) {
              await tx.template.update({
                where: { id: other.id },
                data: { status: 'INACTIVE' }
              });
              deactivatedNames.push(`${other.name} (ID: ${other.id})`);
            }
          }
          if (deactivatedNames.length > 0) {
            warningMsg = `Tự động tắt các template trùng điều kiện hiển thị: ${deactivatedNames.join(', ')}`;
          }
        }

        return { template: finalTemplate, warning: warningMsg || undefined };
      });

      return NextResponse.json({
        success: true,
        template: template.template,
        warning: template.warning,
        message: 'Đã tạo template thành công!'
      });
    }

    // 2. Update existing template
    if (action === 'update') {
      const templateId = parseId(id);
      if (!templateId) {
        return NextResponse.json({ success: false, error: 'Thiếu template ID' }, { status: 400 });
      }

      const updated = await prisma.$transaction(async (tx) => {
        const template = await tx.template.update({
          where: { id: templateId },
          data: {
            name: name !== undefined ? name : undefined,
            type: type !== undefined ? (type as TemplateType) : undefined,
            status: status !== undefined ? (status as TemplateStatus) : undefined,
            componentFile: componentFile !== undefined ? componentFile : undefined,
            htmlContent: htmlContent !== undefined ? htmlContent : undefined,
            cssContent: cssContent !== undefined ? cssContent : undefined,
            builderData: builderData !== undefined ? builderData : undefined,
            isDefault: undefined,
            priority: priority !== undefined ? Number(priority) : undefined,
          },
        });

        // If conditions list is supplied, replace all existing conditions
        if (conditions !== undefined && Array.isArray(conditions)) {
          await tx.templateCondition.deleteMany({
            where: { templateId },
          });

          if (conditions.length > 0) {
            await tx.templateCondition.createMany({
              data: conditions.map((cond: any) => ({
                templateId,
                conditionType: cond.conditionType,
                targetType: cond.targetType,
                targetId: cond.targetId ? Number(cond.targetId) : null,
                targetSlug: cond.targetSlug || null,
              })),
            });
          }
        }

        const finalTemplate = await tx.template.findUnique({
          where: { id: templateId },
          include: { conditions: true },
        });

        let warningMsg = '';
        if (finalTemplate && finalTemplate.status === 'ACTIVE') {
          const activeTemplates = await tx.template.findMany({
            where: {
              type: finalTemplate.type,
              status: 'ACTIVE',
              NOT: { id: templateId }
            },
            include: { conditions: true }
          });

          const deactivatedNames: string[] = [];
          for (const other of activeTemplates) {
            const hasConflict = hasOverlappingConditions(finalTemplate.conditions, other.conditions);
            if (hasConflict) {
              await tx.template.update({
                where: { id: other.id },
                data: { status: 'INACTIVE' }
              });
              deactivatedNames.push(`${other.name} (ID: ${other.id})`);
            }
          }
          if (deactivatedNames.length > 0) {
            warningMsg = `Tự động tắt các template trùng điều kiện hiển thị: ${deactivatedNames.join(', ')}`;
          }
        }

        return { template: finalTemplate, warning: warningMsg || undefined };
      });

      if (updated.template) {
        const { getCurrentUser } = await import('@/lib/session');
        let creator = await getCurrentUser();
        if (!creator) {
          creator = await prisma.user.findFirst({
            orderBy: { createdAt: 'asc' },
          });
        }

        const count = await prisma.pageRevision.count({
          where: { templateId: updated.template.id },
        });
        await prisma.pageRevision.create({
          data: {
            templateId: updated.template.id,
            version: count + 1,
            revisionName: revisionName || null,
            builderData: updated.template.builderData || '',
            htmlContent: updated.template.htmlContent || '',
            cssContent: updated.template.cssContent || null,
            isStarred: Boolean(isStarred),
            commitMessage: commitMessage || (updated.template.status === 'ACTIVE' ? 'Kích hoạt template' : 'Cập nhật template'),
            createdById: creator?.id || null,
          },
        });

        // Clear any temporary autosave for this template
        await prisma.pageAutosave.deleteMany({
          where: { templateId: updated.template.id },
        });
      }

      return NextResponse.json({
        success: true,
        template: updated.template,
        warning: updated.warning,
        message: 'Cập nhật template thành công!'
      });
    }

    // 3. Delete a template
    if (action === 'delete') {
      const templateId = parseId(id);
      if (!templateId) {
        return NextResponse.json({ success: false, error: 'Thiếu template ID' }, { status: 400 });
      }

      await prisma.template.delete({
        where: { id: templateId },
      });

      return NextResponse.json({ success: true, message: 'Đã xóa template thành công!' });
    }

    // 4. Toggle active status
    if (action === 'toggle') {
      const templateId = parseId(id);
      if (!templateId) {
        return NextResponse.json({ success: false, error: 'Thiếu template ID' }, { status: 400 });
      }

      const current = await prisma.template.findUnique({
        where: { id: templateId },
        include: { conditions: true }
      });
      if (!current) {
        return NextResponse.json({ success: false, error: 'Template không tồn tại' }, { status: 404 });
      }

      const nextStatus = current.status === 'ACTIVE' ? 'INACTIVE' : 'ACTIVE';
      
      const result = await prisma.$transaction(async (tx) => {
        let warningMsg = '';

        if (nextStatus === 'ACTIVE') {
          // Find other active templates of the same type
          const activeTemplates = await tx.template.findMany({
            where: {
              type: current.type,
              status: 'ACTIVE',
              NOT: { id: templateId }
            },
            include: { conditions: true }
          });

          // Check for overlapping conditions
          const deactivatedNames: string[] = [];
          for (const other of activeTemplates) {
            const hasConflict = hasOverlappingConditions(current.conditions, other.conditions);
            if (hasConflict) {
              await tx.template.update({
                where: { id: other.id },
                data: { status: 'INACTIVE' }
              });
              deactivatedNames.push(`${other.name} (ID: ${other.id})`);
            }
          }
          if (deactivatedNames.length > 0) {
            warningMsg = `Tự động tắt các template trùng điều kiện hiển thị: ${deactivatedNames.join(', ')}`;
          }
        }

        const updated = await tx.template.update({
          where: { id: templateId },
          data: { status: nextStatus },
          include: { conditions: true },
        });

        return { updated, warningMsg };
      });

      return NextResponse.json({
        success: true,
        template: result.updated,
        warning: result.warningMsg || undefined,
        message: `Đã ${nextStatus === 'ACTIVE' ? 'bật' : 'tắt'} template thành công!`,
      });
    }

    // 5. Duplicate template
    if (action === 'duplicate') {
      const templateId = parseId(id);
      if (!templateId) {
        return NextResponse.json({ success: false, error: 'Thiếu template ID' }, { status: 400 });
      }

      const source = await prisma.template.findUnique({
        where: { id: templateId },
        include: { conditions: true },
      });

      if (!source) {
        return NextResponse.json({ success: false, error: 'Không tìm thấy template nguồn' }, { status: 404 });
      }

      const copy = await prisma.$transaction(async (tx) => {
        const newTemplate = await tx.template.create({
          data: {
            name: `${source.name} (Bản sao)`,
            type: source.type,
            status: 'INACTIVE', // Copy starts as inactive
            componentFile: source.componentFile,
            htmlContent: source.htmlContent,
            cssContent: source.cssContent,
            builderData: source.builderData,
            isDefault: false, // Copies are not default by default
            priority: source.priority,
          },
        });

        if (source.conditions.length > 0) {
          await tx.templateCondition.createMany({
            data: source.conditions.map((cond) => ({
              templateId: newTemplate.id,
              conditionType: cond.conditionType,
              targetType: cond.targetType,
              targetId: cond.targetId,
              targetSlug: cond.targetSlug,
            })),
          });
        }

        return tx.template.findUnique({
          where: { id: newTemplate.id },
          include: { conditions: true },
        });
      });

      return NextResponse.json({ success: true, template: copy, message: 'Nhân bản template thành công!' });
    }



    return NextResponse.json({ success: false, error: 'Hành động không hợp lệ' }, { status: 400 });
  } catch (error: any) {
    console.error('Error managing templates:', error);
    return NextResponse.json(
      { success: false, error: error.message || 'Internal Server Error' },
      { status: 500 }
    );
  }
}
