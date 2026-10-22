
function clean(html) {
  return html
    .replace(/<[^>]*>/g, " ")
    .replace(/&nbsp;/gi, " ")
    .replace(/&amp;/gi, "&")
    .replace(/&#39;|&apos;/gi, "'")
    .replace(/&quot;/gi, '"')
    .replace(/&ndash;/gi, "–")
    .replace(/\s+/g, " ")
    .trim();
}

function parseSchedule(html, clubName) {
  const tokens = html.match(
    /<h[1-6]\b[^>]*>[\s\S]*?<\/h[1-6]>|<tr\b[^>]*>[\s\S]*?<\/tr>/gi
  ) || [];

  const games = [];
  let category = "";

  for (const token of tokens) {
    if (/^<h/i.test(token)) {
      category = clean(token);
      continue;
    }

    const cells = [...token.matchAll(
      /<t[dh]\b[^>]*>([\s\S]*?)<\/t[dh]>/gi
    )].map(m => clean(m[1]));

    if (cells.length < 5) continue;

    const match = cells.find(c => c.includes(" - "));
    if (!match || !match.toUpperCase().includes(clubName)) continue;

    const date = cells.find(c => /\d{2}\/\d{2}\/\d{2,4}/.test(c)) || "";
    const time = cells.find(c => /^\d{1,2}:\d{2}$/.test(c)) || "";
    const result = cells[cells.length - 1] || "";

    games.push({
      category,
      match,
      date,
      time,
      result: /^\d+\s*-\s*\d+/.test(result) ? result : "",
      status: /^\d+\s*-\s*\d+/.test(result) ? "Τελικό" : "Προγραμματισμένος",
      source: "ΕΠΣΑΝΑ"
    });
  }

  return games;
}

export async function onRequestGet() {
  try {
    const teams = [
      {
        name: "ΑΟ Γλυκών Νερών",
        id: 30,
        keyword: "ΓΛΥΚΩΝ ΝΕΡΩΝ ΑΟ"
      },
      {
        name: "Αστέρας Γλυκών Νερών",
        id: 52,
        keyword: "ΑΣ ΑΣΤΕΡΑΣ Γ. ΝΕΡΩΝ"
      }
    ];

    const output = await Promise.all(teams.map(async team => {
      const url =
        `https://epsana.gr/teams/display_team_schedule.php?team_id=${team.id}`;

      const response = await fetch(url, {
        headers: { "User-Agent": "GlykaNeraNews/1.0" },
        cf: { cacheTtl: 300, cacheEverything: true }
      });

      if (!response.ok) throw new Error("Η ΕΠΣΑΝΑ δεν απάντησε.");

      const html = await response.text();

      return {
        team: team.name,
        games: parseSchedule(html, team.keyword)
      };
    }));

    return Response.json(output, {
      headers: {
        "Cache-Control": "public, max-age=300"
      }
    });
  } catch {
    return Response.json(
      { error: "Δεν ήταν δυνατή η φόρτωση των αποτελεσμάτων της ΕΠΣΑΝΑ." },
      { status: 502 }
    );
  }
}
