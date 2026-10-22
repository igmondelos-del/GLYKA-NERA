
const sources = [
  {
    category: "Γυναίκες",
    url: "https://volleylove.gr/"
  }
];

export async function onRequestGet() {
  return new Response(JSON.stringify({
    team: "ΓΣ Γλυκών Νερών",
    source: "ΕΣΠΑΑΑ",
    categories: [
      { name: "Γυναίκες", games: [] },
      { name: "Κ20", games: [] },
      { name: "Κ18", games: [] },
      { name: "Κ16", games: [] }
    ],
    message: "Δεν έχουν συνδεθεί ακόμη οι επίσημες πηγές αποτελεσμάτων."
  }), {
    headers: {
      "Content-Type": "application/json; charset=utf-8",
      "Cache-Control": "no-store"
    }
  });
}
