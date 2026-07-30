async function test() {
  try {
    const res = await fetch('http://localhost:3005/api/posts', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ title: 'test', slug: 'test' })
    });
    const text = await res.text();
    console.log("STATUS:", res.status);
    console.log("BODY:", text);
  } catch (e) {
    console.log("ERROR:", e);
  }
}
test();

