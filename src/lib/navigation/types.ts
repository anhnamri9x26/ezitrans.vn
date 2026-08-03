export interface NavigationMenuItem {
  id: string;
  label: string;
  url: string;
  indent: number;
  isMega?: boolean;
  description?: string;
  icon?: string;
}

export interface NavigationMenuRecord {
  id: number;
  name: string;
  slug: string;
  items: NavigationMenuItem[];
  createdAt: string;
  updatedAt: string;
  assignments?: NavigationMenuAssignmentRecord[];
}

export interface NavigationMenuAssignmentRecord {
  id?: number;
  themeId: string;
  locationKey: string;
  menuId: number;
}

export interface MenuLocationDefinition {
  key: string;
  label: string;
  description?: string;
}

export interface HydratedNavigationData {
  themeId: string;
  menus: Array<Pick<NavigationMenuRecord, 'id' | 'name' | 'slug' | 'items' | 'updatedAt'>>;
  locations: Record<string, {
    menuId: number;
    menuName: string;
    items: NavigationMenuItem[];
  }>;
}
