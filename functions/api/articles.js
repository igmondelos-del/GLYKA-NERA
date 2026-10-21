
export async function onRequestGet({ env }) {
  try {
    const result = await env.DB.prepare(
      "SELECT id, title, category, content, image, created_at FROM articles WHERE published = 1 ORDER BY created_at DESC"
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
      return Response.json({ error: "Δεν έχει ρυθμιστεί ο διαχειριστής." }, { status: 500 });
    }

    const data = await request.json();
    if (typeof data.password !== "string" || data.password !== password) {
      return Response.json({ error: "Λάθος κωδικός." }, { status: 401 });
    }

    const title = typeof data.title === "string" ? data.title.trim() : "";
    const category = typeof data.category === "string" ? data.category.trim() : "";
    const content = typeof data.content === "string" ? data.content.trim() : "";
    const image = typeof data.image === "string" ? data.image.trim() : "";

    if (!title || title.length > 150 || !category || category.length > 60 ||
        !content || content.length > 20000 || image.length > 2000 ||
        (image && !/^https:\/\/\S+$/i.test(image))) {
      return Response.json({ error: "Έλεγξε τα στοιχεία και τον σύνδεσμο φωτογραφίας (χρειάζεται HTTPS)." }, { status: 400 });
    }

    const result = await env.DB.prepare(
      "INSERT INTO articles (title, category, content, image, published) VALUES (?, ?, ?, ?, 1)"
    ).bind(title, category, content, image || null).run();

    return Response.json({ success: true, id: result.meta.last_row_id }, { status: 201 });
  } catch {
    return Response.json(
      { error: "Σφάλμα δημοσίευσης. Ίσως χρειάζεται να προστεθεί η στήλη image στη βάση δεδομένων." },
      { status: 500 }
    );
  }
}

export async function onRequestDelete({ request, env }) {
  try {
    const password = env.ADMIN_PASSWORD;
    const data = await request.json();

    if (!password || data.password !== password) {
      return Response.json({ error: "Λάθος κωδικός." }, { status: 401 });
    }
    if (!Number.isInteger(data.id)) {
      return Response.json({ error: "Μη έγκυρο άρθρο." }, { status: 400 });
    }

    await env.DB.prepare("DELETE FROM articles WHERE id = ?").bind(data.id).run();
    return Response.json({ success: true });
  } catch {
    return Response.json({ error: "Αποτυχία διαγραφής." }, { status: 500 });
  }
}
