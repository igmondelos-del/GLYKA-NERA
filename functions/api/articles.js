
export async function onRequestGet({ env }) {
  try {
    const result = await env.DB.prepare(
      "SELECT id, title, category, content, created_at FROM articles WHERE published = 1 ORDER BY created_at DESC"
    ).all();

    return Response.json(result.results);
  } catch {
    return Response.json(
      { error: "Δεν ήταν δυνατή η φόρτωση των άρθρων." },
      { status: 500 }
    );
  }
}

export async function onRequestPost({ request, env }) {
  try {
    const password = env.ADMIN_PASSWORD;

    if (!password) {
      return Response.json(
        { error: "Δεν έχει ρυθμιστεί ο διαχειριστής." },
        { status: 500 }
      );
    }

    const data = await request.json();

    if (
      typeof data.password !== "string" ||
      data.password !== password
    ) {
      return Response.json(
        { error: "Λάθος κωδικός." },
        { status: 401 }
      );
    }

    const title = typeof data.title === "string"
      ? data.title.trim() : "";
    const category = typeof data.category === "string"
      ? data.category.trim() : "";
    const content = typeof data.content === "string"
      ? data.content.trim() : "";

    if (
      !title || title.length > 150 ||
      !category || category.length > 60 ||
      !content || content.length > 20000
    ) {
      return Response.json(
        { error: "Έλεγξε τον τίτλο, την κατηγορία και το κείμενο." },
        { status: 400 }
      );
    }

    const result = await env.DB.prepare(
      "INSERT INTO articles (title, category, content, published) VALUES (?, ?, ?, 1)"
    ).bind(title, category, content).run();

    return Response.json({
      success: true,
      id: result.meta.last_row_id
    }, { status: 201 });
  } catch {
    return Response.json(
      { error: "Παρουσιάστηκε σφάλμα κατά τη δημοσίευση." },
      { status: 500 }
    );
  }
}
