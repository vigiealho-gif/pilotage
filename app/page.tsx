"use client";
import { useEffect, useMemo, useState } from "react";
import ImportManager from "./import-manager";

type Agent = {
  id: number | string;
  uniqueId?: string;
  nom: string;
  equipe: string;
  activite: "Front" | "Asynchrone";
  statut: "Actif" | "Absent" | "Formation" | "Mutualisé" | "Parti";
  arrivee: string;
  prod: number;
  qualite: number;
  tendance: number;
  retour?: string;
  asyCapabilities?: string[];
  mutualizedCapabilities?: string[];
  contacts?: Record<string, string>;
  managers?: Record<string, string>;
  departureDate?: string;
  departureReason?: string;
};
type Movement = {
  id: string;
  type: string;
  agent: string;
  detail: string;
  date: string;
  tone: string;
};
const seedAgents: Agent[] = [
  {
    id: 601405,
    nom: "Hanae Nasri",
    equipe: "CC Front A",
    activite: "Front",
    statut: "Actif",
    arrivee: "12/03/2025",
    prod: 6.8,
    qualite: 91,
    tendance: 7,
  },
  {
    id: 601088,
    nom: "Salma El Baz",
    equipe: "CC Front A",
    activite: "Front",
    statut: "Actif",
    arrivee: "08/07/2024",
    prod: 7.2,
    qualite: 94,
    tendance: 11,
  },
  {
    id: 600512,
    nom: "Latifa Lakbir",
    equipe: "CC Front B",
    activite: "Front",
    statut: "Formation",
    arrivee: "19/11/2023",
    prod: 6.1,
    qualite: 89,
    tendance: -2,
    retour: "24 août",
  },
  {
    id: 601296,
    nom: "Anouar El Badmoussi",
    equipe: "CC Asynchrone",
    activite: "Asynchrone",
    statut: "Mutualisé",
    arrivee: "02/01/2025",
    prod: 5.9,
    qualite: 87,
    tendance: 4,
    retour: "31 août",
  },
  {
    id: 601475,
    nom: "Safae El Morabet",
    equipe: "CC Asynchrone",
    activite: "Asynchrone",
    statut: "Actif",
    arrivee: "15/05/2025",
    prod: 6.5,
    qualite: 96,
    tendance: 8,
  },
  {
    id: 600727,
    nom: "Hafid Zaanoun",
    equipe: "CC Front B",
    activite: "Front",
    statut: "Absent",
    arrivee: "22/09/2022",
    prod: 6.3,
    qualite: 93,
    tendance: -6,
    retour: "28 août",
  },
  {
    id: 601481,
    nom: "Oumaima Lamiri",
    equipe: "CC Asynchrone",
    activite: "Asynchrone",
    statut: "Actif",
    arrivee: "10/06/2025",
    prod: 5.7,
    qualite: 84,
    tendance: -9,
  },
];
const Icon = ({ children }: { children: React.ReactNode }) => (
  <span className="icon" aria-hidden="true">
    {children}
  </span>
);

export default function Home() {
  const [section, setSection] = useState("Vue d’ensemble"),
    [query, setQuery] = useState(""),
    [activity, setActivity] = useState("Toutes activités"),
    [status, setStatus] = useState("Tous statuts");
  const [agents, setAgents] = useState<Agent[]>(() => {
      if (typeof window === "undefined") return seedAgents;
      try {
        return (
          JSON.parse(localStorage.getItem("pilotage-workforce-v2") || "null") ||
          seedAgents
        );
      } catch {
        return seedAgents;
      }
    }),
    [drawer, setDrawer] = useState<Agent | null>(null),
    [modal, setModal] = useState<"agent" | "movement" | "import" | null>(null),
    [toast, setToast] = useState("");
  const [movements, setMovements] = useState<Movement[]>(() => {
    if (typeof window === "undefined") return [];
    try {
      return JSON.parse(localStorage.getItem("pilotage-movements-v1") || "[]");
    } catch {
      return [];
    }
  });
  useEffect(() => {
    localStorage.setItem("pilotage-workforce-v2", JSON.stringify(agents));
  }, [agents]);
  useEffect(() => {
    localStorage.setItem("pilotage-movements-v1", JSON.stringify(movements));
  }, [movements]);
  const filtered = useMemo(
    () =>
      agents.filter(
        (a) =>
          `${a.nom} ${a.id} ${a.equipe}`
            .toLowerCase()
            .includes(query.toLowerCase()) &&
          (activity === "Toutes activités" || a.activite === activity) &&
          (status === "Tous statuts" || a.statut === status),
      ),
    [agents, query, activity, status],
  );
  const notify = (m: string) => {
    setToast(m);
    window.setTimeout(() => setToast(""), 2600);
  };
  const nav = [
    "Vue d’ensemble",
    "Agents",
    "Mouvements",
    "Productivité",
    "Planning",
    "Imports",
  ];
  return (
    <div className="app-shell">
      <aside className="sidebar">
        <div className="brand-mark">
          <span>PF</span>
          <div>
            <strong>Pilotage</strong>
            <small>Flux & Effectifs</small>
          </div>
        </div>
        <nav aria-label="Navigation principale">
          <p className="nav-label">ESPACE DE TRAVAIL</p>
          {nav.map((item, i) => (
            <button
              key={item}
              className={section === item ? "nav-item active" : "nav-item"}
              onClick={() => {
                setSection(item);
                if (item === "Imports") setModal("import");
              }}
            >
              <Icon>{["⌂", "◎", "⇄", "↗", "▦", "⇧"][i]}</Icon>
              {item}
              {item === "Mouvements" && movements.length > 0 && (
                <em>{movements.length}</em>
              )}
            </button>
          ))}
        </nav>
        <div className="sidebar-bottom">
          <button className="nav-item">
            <Icon>⚙</Icon>Paramètres
          </button>
          <div className="profile">
            <div className="avatar">SM</div>
            <div>
              <strong>Sanae SMR</strong>
              <small>Administratrice</small>
            </div>
            <button aria-label="Plus d’options">•••</button>
          </div>
        </div>
      </aside>
      <main className="main-content">
        <header className="topbar">
          <div>
            <p className="eyebrow">ALH · PILOTAGE OPÉRATIONNEL</p>
            <h1>{section}</h1>
            <p className="subtitle">
              Données enregistrées localement · prêtes pour Firebase
            </p>
          </div>
          <div className="header-actions">
            <button className="icon-btn" aria-label="Notifications">
              ♢<b>3</b>
            </button>
            <button
              className="btn secondary"
              onClick={() => setModal("import")}
            >
              ⇧ Importer
            </button>
            <button className="btn primary" onClick={() => setModal("agent")}>
              ＋ Ajouter un agent
            </button>
          </div>
        </header>
        <section className="pulse-card">
          <div className="pulse-title">
            <span className="live-dot" />
            <div>
              <strong>Situation du jour</strong>
              <small>Disponibilité nette des équipes</small>
            </div>
          </div>
          <div className="pulse-stat">
            <span>Effectif total</span>
            <strong>42</strong>
            <small>agents rattachés</small>
          </div>
          <div className="pulse-stat">
            <span>Disponibles</span>
            <strong className="green">36</strong>
            <small>85,7% de l’effectif</small>
          </div>
          <div className="pulse-stat">
            <span>Besoin planifié</span>
            <strong>40</strong>
            <small>pour aujourd’hui</small>
          </div>
          <div className="coverage">
            <div className="coverage-head">
              <span>Taux de couverture</span>
              <strong>90%</strong>
            </div>
            <div className="progress">
              <i style={{ width: "90%" }} />
            </div>
            <small>
              <b>–4 agents</b> par rapport au besoin
            </small>
          </div>
        </section>
        <section className="kpi-grid">
          {[
            [
              "↗",
              "green-bg",
              "INTÉGRATIONS",
              "+2 ce mois",
              "5",
              "3 opérationnels · 2 en formation",
            ],
            [
              "↘",
              "red-bg",
              "DÉPARTS",
              "ce mois",
              "3",
              "1 départ prévu le 28 août",
            ],
            [
              "⇄",
              "amber-bg",
              "MUTUALISATIONS",
              "–2 net",
              "4 sortants",
              "2 entrants · solde défavorable",
            ],
            [
              "◷",
              "blue-bg",
              "INDISPONIBLES",
              "aujourd’hui",
              "4",
              "2 absences · 2 formations",
            ],
          ].map((k) => (
            <article className="kpi-card" key={k[2]}>
              <div className={`kpi-icon ${k[1]}`}>{k[0]}</div>
              <div className="kpi-top">
                <span>{k[2]}</span>
                <em>{k[3]}</em>
              </div>
              <strong>{k[4]}</strong>
              <p>{k[5]}</p>
            </article>
          ))}
        </section>
        <section className="content-grid">
          <article className="panel trend-panel">
            <div className="panel-head">
              <div>
                <h2>Évolution de l’effectif disponible</h2>
                <p>6 derniers mois · effectif en fin de mois</p>
              </div>
              <button className="more">•••</button>
            </div>
            <div className="chart-wrap">
              <div className="y-labels">
                <span>40</span>
                <span>35</span>
                <span>30</span>
                <span>25</span>
              </div>
              <svg
                viewBox="0 0 640 210"
                preserveAspectRatio="none"
                aria-label="Courbe de l’effectif disponible"
              >
                <defs>
                  <linearGradient id="area" x1="0" y1="0" x2="0" y2="1">
                    <stop offset="0" stopColor="#2d725f" stopOpacity=".18" />
                    <stop offset="1" stopColor="#2d725f" stopOpacity="0" />
                  </linearGradient>
                </defs>
                <g className="grid-lines">
                  <line x1="0" y1="20" x2="640" y2="20" />
                  <line x1="0" y1="75" x2="640" y2="75" />
                  <line x1="0" y1="130" x2="640" y2="130" />
                  <line x1="0" y1="185" x2="640" y2="185" />
                </g>
                <path
                  className="area"
                  d="M10 144 C80 138 95 123 135 128 S210 107 260 110 S330 69 385 78 S470 46 510 58 S580 30 630 35 L630 190 L10 190Z"
                />
                <path
                  className="line"
                  d="M10 144 C80 138 95 123 135 128 S210 107 260 110 S330 69 385 78 S470 46 510 58 S580 30 630 35"
                />
                {[
                  [10, 144],
                  [135, 128],
                  [260, 110],
                  [385, 78],
                  [510, 58],
                  [630, 35],
                ].map(([x, y], i) => (
                  <g key={x}>
                    <circle cx={x} cy={y} r="5" />
                    <text x={x} y={y - 14}>
                      {[31, 32, 34, 37, 39, 40][i]}
                    </text>
                  </g>
                ))}
              </svg>
              <div className="x-labels">
                <span>Mars</span>
                <span>Avril</span>
                <span>Mai</span>
                <span>Juin</span>
                <span>Juillet</span>
                <span>Août</span>
              </div>
            </div>
          </article>
          <article className="panel alerts-panel">
            <div className="panel-head">
              <div>
                <h2>Points d’attention</h2>
                <p>3 actions requises</p>
              </div>
              <button className="text-btn">Tout voir</button>
            </div>
            {[
              [
                "critical",
                "!",
                "Couverture insuffisante",
                "CC Front B · déficit de 3 agents",
                "Aujourd’hui",
              ],
              [
                "warning",
                "◷",
                "Retour à confirmer",
                "Latifa Lakbir · formation",
                "24 août",
              ],
              [
                "neutral",
                "↘",
                "Baisse de productivité",
                "Oumaima Lamiri · –9%",
                "7 jours",
              ],
            ].map((a) => (
              <div className={`alert-item ${a[0]}`} key={a[2]}>
                <span>{a[1]}</span>
                <div>
                  <strong>{a[2]}</strong>
                  <p>{a[3]}</p>
                </div>
                <small>{a[4]}</small>
              </div>
            ))}
            <button
              className="alert-cta"
              onClick={() => notify("Liste des alertes actualisée")}
            >
              Consulter toutes les alertes <b>→</b>
            </button>
          </article>
        </section>
        <section className="panel agents-panel">
          <div className="panel-head agents-heading">
            <div>
              <h2>Agents</h2>
              <p>
                {filtered.length} affichés sur {agents.length} agents
              </p>
            </div>
            <div className="filters">
              <label className="searchbox">
                ⌕
                <input
                  aria-label="Rechercher un agent"
                  value={query}
                  onChange={(e) => setQuery(e.target.value)}
                  placeholder="Nom, ID ou équipe…"
                />
              </label>
              <select
                aria-label="Filtrer par activité"
                value={activity}
                onChange={(e) => setActivity(e.target.value)}
              >
                <option>Toutes activités</option>
                <option>Front</option>
                <option>Asynchrone</option>
              </select>
              <select
                aria-label="Filtrer par statut"
                value={status}
                onChange={(e) => setStatus(e.target.value)}
              >
                <option>Tous statuts</option>
                <option>Actif</option>
                <option>Absent</option>
                <option>Formation</option>
                <option>Mutualisé</option>
                <option>Parti</option>
              </select>
            </div>
          </div>
          <div className="table-scroll">
            <table>
              <thead>
                <tr>
                  <th>AGENT</th>
                  <th>ACTIVITÉ PRINCIPALE</th>
                  <th>HABILITATIONS</th>
                  <th>ÉQUIPE</th>
                  <th>STATUT</th>
                  <th>ENTRÉE</th>
                  <th></th>
                </tr>
              </thead>
              <tbody>
                {filtered.map((a) => (
                  <tr key={a.id} onClick={() => setDrawer(a)}>
                    <td>
                      <div className="agent-cell">
                        <span>
                          {a.nom
                            .split(" ")
                            .map((n) => n[0])
                            .slice(0, 2)
                            .join("")}
                        </span>
                        <div>
                          <strong>{a.nom}</strong>
                          <small>ID {a.uniqueId || a.id}</small>
                        </div>
                      </div>
                    </td>
                    <td>
                      <span className={`activity ${a.activite.toLowerCase()}`}>
                        {a.activite}
                      </span>
                    </td>
                    <td>
                      <small>
                        {[
                          ...(a.asyCapabilities || []).map((x) => `ASY ${x}`),
                          ...(a.mutualizedCapabilities || []).map(
                            (x) => `Mut. ${x}`,
                          ),
                        ].join(" · ") || "—"}
                      </small>
                    </td>
                    <td>{a.equipe}</td>
                    <td>
                      <span
                        className={`status ${a.statut.toLowerCase().replace("é", "e")}`}
                      >
                        <i />
                        {a.statut}
                      </span>
                      {a.departureDate && (
                        <small className="return">
                          {a.departureDate} · {a.departureReason}
                        </small>
                      )}
                    </td>
                    <td>{a.arrivee}</td>
                    <td>
                      <button className="row-more">•••</button>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
          <div className="table-footer">
            <span>
              Affichage de 1 à {filtered.length} sur {agents.length}
            </span>
            <div>
              <button disabled>‹</button>
              <button className="current">1</button>
              <button disabled>›</button>
            </div>
          </div>
        </section>
        <section className="bottom-grid">
          <article className="panel">
            <div className="panel-head">
              <div>
                <h2>Derniers mouvements</h2>
                <p>Historique des changements récents</p>
              </div>
              <button className="text-btn" onClick={() => setModal("movement")}>
                ＋ Nouveau mouvement
              </button>
            </div>
            <div className="movement-list">
              {movements.length === 0 ? (
                <p className="empty-state">
                  Aucun mouvement réel enregistré pour le moment.
                </p>
              ) : movements.map((m) => (
                <div className="movement" key={m.id}>
                  <span className={m.tone}>
                    {m.type === "Mutualisation"
                      ? "⇄"
                      : m.type === "Intégration"
                        ? "↗"
                        : m.type === "Retour"
                          ? "↩"
                          : "◷"}
                  </span>
                  <div>
                    <strong>{m.agent}</strong>
                    <p>
                      {m.type} · {m.detail}
                    </p>
                  </div>
                  <small>{m.date}</small>
                </div>
              ))}
            </div>
          </article>
          <article className="panel team-panel">
            <div className="panel-head">
              <div>
                <h2>Couverture par équipe</h2>
                <p>Disponible versus besoin planifié</p>
              </div>
            </div>
            {[
              ["CC Front A", 12, 12],
              ["CC Front B", 8, 11],
              ["CC Asynchrone", 10, 11],
              ["Encadrement", 6, 6],
            ].map(([name, have, need]) => (
              <div className="team-cover" key={String(name)}>
                <div>
                  <strong>{name}</strong>
                  <span>
                    <b>{have}</b> / {need}
                  </span>
                </div>
                <div className="team-progress">
                  <i
                    style={{ width: `${(Number(have) / Number(need)) * 100}%` }}
                    className={Number(have) < Number(need) ? "short" : ""}
                  />
                </div>
              </div>
            ))}
          </article>
        </section>
      </main>
      {drawer && (
        <div className="overlay" onMouseDown={() => setDrawer(null)}>
          <aside className="drawer" onMouseDown={(e) => e.stopPropagation()}>
            <button className="drawer-close" onClick={() => setDrawer(null)}>
              ×
            </button>
            <div className="drawer-identity">
              <div className="big-avatar">
                {drawer.nom
                  .split(" ")
                  .map((n) => n[0])
                  .slice(0, 2)
                  .join("")}
              </div>
              <h2>{drawer.nom}</h2>
              <p>
                ID {drawer.uniqueId || drawer.id} · {drawer.equipe}
              </p>
              <span
                className={`status ${drawer.statut.toLowerCase().replace("é", "e")}`}
              >
                <i />
                {drawer.statut}
              </span>
            </div>
            <div className="drawer-section">
              <h3>Affectation & habilitations</h3>
              <dl>
                <div>
                  <dt>Activité principale</dt>
                  <dd>{drawer.activite}</dd>
                </div>
                <div>
                  <dt>Spécialités ASY</dt>
                  <dd>{drawer.asyCapabilities?.join(", ") || "—"}</dd>
                </div>
                <div>
                  <dt>Mutualisé vers</dt>
                  <dd>{drawer.mutualizedCapabilities?.join(", ") || "—"}</dd>
                </div>
                <div>
                  <dt>Date d’entrée</dt>
                  <dd>{drawer.arrivee}</dd>
                </div>
                {drawer.departureDate && (
                  <div>
                    <dt>Départ</dt>
                    <dd>
                      {drawer.departureDate} · {drawer.departureReason}
                    </dd>
                  </div>
                )}
              </dl>
            </div>
            <div className="drawer-section">
              <h3>Contacts par activité</h3>
              <dl>
                {Object.entries(drawer.contacts || {}).map(([k, v]) => (
                  <div key={k}>
                    <dt>{k}</dt>
                    <dd>{v || "—"}</dd>
                  </div>
                ))}
              </dl>
            </div>
            <div className="drawer-actions">
              <button
                className="btn secondary"
                onClick={() => notify("Fiche prête à être modifiée")}
              >
                Modifier la fiche
              </button>
              <button
                className="btn primary"
                onClick={() => {
                  setDrawer(null);
                  setModal("movement");
                }}
              >
                Ajouter un mouvement
              </button>
            </div>
          </aside>
        </div>
      )}
      {modal && (
        <div
          className="overlay modal-overlay"
          onMouseDown={() => setModal(null)}
        >
          <div
            className={`modal ${modal === "import" ? "import-modal" : ""}`}
            onMouseDown={(e) => e.stopPropagation()}
          >
            <button className="drawer-close" onClick={() => setModal(null)}>
              ×
            </button>
            <p className="eyebrow">
              {modal === "import"
                ? "MISE À JOUR DES EFFECTIFS"
                : "NOUVEL ENREGISTREMENT"}
            </p>
            <h2>
              {modal === "agent"
                ? "Ajouter un agent"
                : modal === "movement"
                  ? "Enregistrer un mouvement"
                  : "Importer les fichiers d’effectif"}
            </h2>
            <p className="modal-sub">
              {modal === "agent"
                ? "Complétez les informations d’affectation de l’agent."
                : modal === "movement"
                  ? "Le mouvement sera ajouté à l’historique de l’agent."
                  : "Prévisualisez les ajouts, mises à jour, mutualisations et départs avant validation."}
            </p>
            {modal === "agent" ? (
              <AgentForm
                onCancel={() => setModal(null)}
                onSave={(name, team, act) => {
                  const id = `MAN-${Date.now()}`;
                  setAgents([
                    ...agents,
                    {
                      id,
                      uniqueId: id,
                      nom: name,
                      equipe: team,
                      activite: act as Agent["activite"],
                      statut: "Actif",
                      arrivee: new Date().toLocaleDateString("fr-FR"),
                      prod: 0,
                      qualite: 0,
                      tendance: 0,
                    },
                  ]);
                  setModal(null);
                  notify(`${name} a été ajouté(e)`);
                }}
              />
            ) : modal === "movement" ? (
              <MovementForm
                agents={agents}
                onCancel={() => setModal(null)}
                onSave={(movement) => {
                  setMovements([movement, ...movements]);
                  setModal(null);
                  notify("Mouvement enregistré avec succès");
                }}
              />
            ) : (
              <ImportManager
                agents={agents}
                onCancel={() => setModal(null)}
                onApply={(next, stats) => {
                  setAgents(next as Agent[]);
                  setModal(null);
                  notify(
                    `Import terminé : ${stats.added} ajout(s), ${stats.updated} mise(s) à jour, ${stats.departed} départ(s)`,
                  );
                }}
              />
            )}
          </div>
        </div>
      )}
      {toast && <div className="toast">✓ {toast}</div>}
    </div>
  );
}

function AgentForm({
  onCancel,
  onSave,
}: {
  onCancel: () => void;
  onSave: (n: string, t: string, a: string) => void;
}) {
  const [name, setName] = useState("");
  const [team, setTeam] = useState("CC Front A");
  const [act, setAct] = useState("Front");
  return (
    <form
      onSubmit={(e) => {
        e.preventDefault();
        if (name.trim()) onSave(name.trim(), team, act);
      }}
    >
      <div className="form-grid">
        <label className="full">
          Nom complet
          <input
            required
            value={name}
            onChange={(e) => setName(e.target.value)}
            placeholder="Ex. Karima El Boukhari"
          />
        </label>
        <label>
          Activité
          <select value={act} onChange={(e) => setAct(e.target.value)}>
            <option>Front</option>
            <option>Asynchrone</option>
          </select>
        </label>
        <label>
          Équipe
          <select value={team} onChange={(e) => setTeam(e.target.value)}>
            <option>CC Front A</option>
            <option>CC Front B</option>
            <option>CC Asynchrone</option>
            <option>Encadrement</option>
          </select>
        </label>
        <label>
          Date d’entrée
          <input type="date" defaultValue="2026-08-20" />
        </label>
        <label>
          Identifiant
          <input placeholder="Généré automatiquement" disabled />
        </label>
      </div>
      <div className="form-actions">
        <button type="button" className="btn secondary" onClick={onCancel}>
          Annuler
        </button>
        <button className="btn primary">Ajouter l’agent</button>
      </div>
    </form>
  );
}
function MovementForm({
  agents,
  onCancel,
  onSave,
}: {
  agents: Agent[];
  onCancel: () => void;
  onSave: (movement: Movement) => void;
}) {
  const [agent, setAgent] = useState("");
  const [type, setType] = useState("Mutualisation");
  const [date, setDate] = useState(new Date().toISOString().slice(0, 10));
  const [destination, setDestination] = useState("Front");
  const [comment, setComment] = useState("");
  return (
    <form
      onSubmit={(e) => {
        e.preventDefault();
        const tone = type === "Départ" || type === "Absence" ? "red" : type === "Mutualisation" ? "amber" : "green";
        const detail = comment.trim() || (type === "Mutualisation" || type === "Retour" ? `Vers ${destination}` : destination);
        onSave({id:`MOV-${Date.now()}`,type,agent,detail,date:new Date(`${date}T12:00:00`).toLocaleDateString("fr-FR"),tone});
      }}
    >
      <div className="form-grid">
        <label className="full">
          Agent
          <select required value={agent} onChange={(e) => setAgent(e.target.value)}>
            <option value="" disabled>
              Sélectionner un agent
            </option>
            {agents.filter((a) => a.statut !== "Parti").map((a) => (
              <option key={a.id}>{a.nom}</option>
            ))}
          </select>
        </label>
        <label>
          Type de mouvement
          <select value={type} onChange={(e) => setType(e.target.value)}>
            <option>Mutualisation</option>
            <option>Absence</option>
            <option>Formation</option>
            <option>Départ</option>
            <option>Retour</option>
          </select>
        </label>
        <label>
          Date d’effet
          <input type="date" required value={date} onChange={(e) => setDate(e.target.value)} />
        </label>
        <label>
          Date de retour prévue
          <input type="date" />
        </label>
        <label>
          Activité de destination
          <select value={destination} onChange={(e) => setDestination(e.target.value)}>
            <option>Front</option>
            <option>Asynchrone</option>
          </select>
        </label>
        <label className="full">
          Commentaire
          <textarea value={comment} onChange={(e) => setComment(e.target.value)} placeholder="Précisez le motif ou les informations utiles…" />
        </label>
      </div>
      <div className="form-actions">
        <button type="button" className="btn secondary" onClick={onCancel}>
          Annuler
        </button>
        <button className="btn primary">Enregistrer</button>
      </div>
    </form>
  );
}
