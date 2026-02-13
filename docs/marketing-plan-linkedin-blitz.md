# LinkedIn Marketing-Blitz: „AI-enabled CMS"

## Kampagnen-Übersicht

| Eigenschaft        | Details                                                                 |
| ------------------ | ----------------------------------------------------------------------- |
| **Plattform**      | LinkedIn (Unternehmensseite + Personal Branding)                        |
| **Laufzeit**       | 3 Wochen (9 Posts)                                                      |
| **Frequenz**       | Montag, Mittwoch, Freitag                                               |
| **Zielgruppe**     | Marketing-Leiter, Content-Strategen, CTOs, Agenturen                    |
| **Kernbotschaft**  | „Dein CMS kann jetzt denken – Content Operations mit KI automatisieren" |
| **Hashtags (fix)** | `#AIenabledCMS` `#ContentOperations` `#kickstartDS`                     |

---

## Format-Konzept: „Vorher → Nachher" Carousel + Hook

### Warum dieses Format?

- **Carousels** erzielen auf LinkedIn 2–3× höhere Verweildauer und Reichweite als reine Text-Posts
- **Vorher/Nachher** ist sofort verständlich und erzeugt einen „Aha"-Moment
- **Jeder Post** zeigt einen konkreten Content-Operations-Workflow: links der manuelle Weg (mühsam, fehleranfällig), rechts der automatisierte Weg (KI + MCP + n8n)
- Ergänzend gibt es **Video-Posts** (Screen-Recordings) und **Meinungs-Posts** (Thought Leadership)

### Post-Struktur (Carousel-Posts)

| Slide | Inhalt                                                                          |
| ----- | ------------------------------------------------------------------------------- |
| 1     | **Hook-Slide**: Provokante Frage oder Statistik als Eyecatcher                  |
| 2     | **Vorher**: Der manuelle, zeitfressende Prozess (Pain Point)                    |
| 3     | **Nachher**: Der automatisierte Workflow (Lösungsdiagramm)                      |
| 4     | **Live-Screenshot**: Echtes Ergebnis im CMS / auf der Website                   |
| 5     | **Tech-Stack**: Welche Tools beteiligt sind (MCP, n8n, GPT-4, Storyblok)        |
| 6     | **CTA-Slide**: „Willst du sehen, wie das funktioniert? Link in den Kommentaren" |

### Post-Struktur (Video-Posts)

- 60–90 Sekunden Screen-Recording
- Untertitel (auto-generated + korrigiert)
- Begleittext: kurzer Hook + 3 Bullet Points + CTA

### Post-Struktur (Thought-Leadership-Posts)

- Reiner Text, 800–1.200 Zeichen
- Persönliche Perspektive / kontroverses Statement
- Frage am Ende, um Diskussion anzuregen

---

## Content-Kalender

### Woche 1 – „Das Problem sichtbar machen"

Fokus: Awareness schaffen, Pain Points der manuellen Content-Arbeit zeigen.

#### Montag W1 – 🎠 Carousel

**Thema:** Bulk-Seiten-Generierung vs. manuelles Erstellen

> **Hook:** „50 Landing Pages. 1 Marketingmanager. 3 Wochen Deadline. Klingt nach Burnout – oder nach einem Plan."
>
> **Vorher:** Redakteur erstellt manuell Seite für Seite: Copy schreiben, Bilder suchen, Komponenten zusammenklicken. 50 Seiten = 50× derselbe Ablauf.
>
> **Nachher:** Google Sheet mit Produktdaten → n8n-Workflow → `generate_content` erzeugt KI-gestützt Hero, Features & CTA → `create_page_with_content` legt Seiten automatisch an, inklusive Bildupload. 50 Seiten in 50 Minuten.
>
> **CTA:** „Wie viele Seiten erstellt dein Team pro Woche – manuell?"

**Hashtags:** `#AIenabledCMS` `#ContentOperations` `#kickstartDS` `#ContentAutomation` `#n8n`

---

#### Mittwoch W1 – 🎥 Video (Screen-Recording)

**Thema:** Live-Demo: Von der Idee zur fertigen CMS-Seite in 2 Minuten

> **Hook:** „Ich beschreibe eine Seite in einem Satz. 90 Sekunden später ist sie live im CMS. Kein Template. Kein Copy-Paste. Nur KI + Design System."
>
> **Video-Inhalt:** Claude Desktop öffnen → Prompt eingeben („Erstelle eine Landing Page für unser neues Produkt X mit Hero, Features und FAQ") → `generate_content` läuft → Seite erscheint in Storyblok Visual Editor → kurzer Klick durch die fertige Seite.
>
> **CTA:** „Das ist kein Prototyp – das ist Produktion. Link zum Setup in den Kommentaren."

**Hashtags:** `#AIenabledCMS` `#ContentOperations` `#kickstartDS` `#LiveDemo` `#MCP`

---

#### Freitag W1 – 💬 Thought Leadership

**Thema:** „Dein CMS ist so schlau wie ein leeres Textfeld"

> **Text:**
>
> Die meisten Unternehmen investieren sechsstellig in ihr CMS.
> Und dann sitzen Redakteure davor und tippen.
>
> Kein Kontext. Keine Automatisierung. Keine Intelligenz.
>
> Das CMS weiß nicht, welche Komponenten es gibt.
> Es weiß nicht, wie die Marke klingt.
> Es weiß nicht, dass der Alt-Text fehlt.
>
> Wir haben das geändert.
>
> Unser CMS kennt sein eigenes Design System.
> Es generiert Inhalte, die sofort zu den verfügbaren Bausteinen passen.
> Es prüft Qualität automatisch.
> Und der Redakteur? Wird vom Produzenten zum Kurator.
>
> 💡 Die Frage ist nicht „Brauchen wir KI im CMS?"
> Die Frage ist: „Wie lange können wir es uns leisten, ohne zu arbeiten?"
>
> Was denkt ihr – wo liegt bei euch der größte Zeitfresser in der Content-Produktion?

**Hashtags:** `#AIenabledCMS` `#ContentOperations` `#kickstartDS` `#ContentStrategy` `#ThoughtLeadership`

---

### Woche 2 – „Die Lösung im Detail"

Fokus: Konkrete Workflows zeigen, technisches Vertrauen aufbauen.

#### Montag W2 – 🎠 Carousel

**Thema:** Website-Relaunch: Content-Migration per KI

> **Hook:** „Website-Relaunch geplant? Alte Inhalte manuell rüberkopieren? Das war 2024."
>
> **Vorher:** Jede Seite manuell abgleichen, Copy-Paste in neue Struktur, Bilder neu hochladen, Formatierung anpassen. Wochen an Arbeit.
>
> **Nachher:** Sitemap der alten Seite → `scrape_url` extrahiert sauberes Markdown → `generate_content` konvertiert in Design-System-Struktur → `create_page_with_content` legt neue Seiten an mit automatischem Asset-Upload. Diff-Report für QA inklusive.
>
> **Tech-Slide:** MCP Server → n8n → Storyblok + kickstartDS Design System
>
> **CTA:** „Wie viele Stunden hat euer letzter Relaunch nur für Content-Migration gekostet?"

**Hashtags:** `#AIenabledCMS` `#ContentOperations` `#kickstartDS` `#WebsiteRelaunch` `#ContentMigration`

---

#### Mittwoch W2 – 🎠 Carousel

**Thema:** Automatischer Content-Audit: Qualität auf Autopilot

> **Hook:** „Fehlende Alt-Texte. Verwaiste Bilder. Seiten ohne Meta-Description. Weißt du, wie viele davon gerade auf deiner Website sind?"
>
> **Vorher:** Manuelles Durchklicken jeder Seite. Spreadsheet führen. Irgendwann aufgeben.
>
> **Nachher:** n8n-Workflow läuft wöchentlich automatisch → `list_stories` + `get_story` inventarisiert den gesamten Content → Regelwerk prüft auf Qualitätskriterien → Audit-Report landet im Slack.
>
> **Live-Screenshot:** Beispiel-Audit-Report: „12 Seiten ohne Alt-Text, 3 verwaiste Assets, 5 Seiten unter 200 Wörter"
>
> **CTA:** „Automatische Qualitätssicherung statt manueller Stichproben. Klingt gut?"

**Hashtags:** `#AIenabledCMS` `#ContentOperations` `#kickstartDS` `#ContentAudit` `#QualityAssurance`

---

#### Freitag W2 – 🎥 Video (Screen-Recording)

**Thema:** Live-Demo: Blog-Autopilot aus RSS-Feed

> **Hook:** „Unser Blog schreibt sich quasi selbst. Nicht 100 % – aber die ersten 80 % macht die KI. Hier seht ihr wie."
>
> **Video-Inhalt:** n8n-Dashboard öffnen → RSS-Feed-Workflow zeigen → Trigger: neuer Artikel im Branchen-Feed → `scrape_url` holt Volltext → `generate_content` schreibt eigenen Blogpost → Draft in Storyblok → Slack-Notification „Neuer Entwurf wartet auf Review" → kurzer Blick in Storyblok: fertiger Draft mit Bildern.
>
> **CTA:** „80 % weniger Aufwand. 100 % Kontrolle. Der Redakteur prüft und publiziert – die KI liefert den Rohstoff."

**Hashtags:** `#AIenabledCMS` `#ContentOperations` `#kickstartDS` `#BlogAutomation` `#RSS`

---

### Woche 3 – „Vision & Call to Action"

Fokus: Große Vision zeichnen, Community aktivieren, Conversion.

#### Montag W3 – 🎠 Carousel

**Thema:** Der komplette Content-Operations-Stack auf einer Slide

> **Hook:** „12 Workflows. 1 MCP Server. 0 manuelle Copy-Paste-Orgien."
>
> **Slide 2:** Übersichtsgrafik aller 12 Workflows (Bulk-Generierung, Migration, Blog-Autopilot, Content-Audit, SEO-Monitoring, Broken-Asset-Detektion, Competitor-Monitoring, Event-Seiten, Übersetzung, Freshness-Tracker, Dashboard, Archivierung)
>
> **Slide 3:** Architektur-Diagramm: `Storyblok ↔ MCP Server ↔ n8n / Claude Desktop ↔ GPT-4 + Design System`
>
> **Slide 4:** Testimonial / Metriken: „Vorher: 3h pro Landing Page. Nachher: 15 Minuten inkl. Review."
>
> **Slide 5:** „Das Design System ist der Schlüssel – die KI generiert keine beliebigen Inhalte, sondern solche, die exakt zu den verfügbaren Bausteinen passen."
>
> **CTA:** „Welcher dieser 12 Workflows würde bei euch am meisten Zeit sparen?"

**Hashtags:** `#AIenabledCMS` `#ContentOperations` `#kickstartDS` `#DesignSystem` `#Automation`

---

#### Mittwoch W3 – 💬 Thought Leadership

**Thema:** „Der Redakteur der Zukunft ist ein Kurator"

> **Text:**
>
> Wir haben 5 Jahre an einem Design System gebaut.
> Komponenten, Tokens, Guidelines – alles dokumentiert.
>
> Dann kam der Moment, in dem die KI das System verstanden hat.
>
> Nicht als Spielerei. Sondern produktiv:
> → Sie kennt jede verfügbare Komponente
> → Sie weiß, welche Props jede Komponente akzeptiert
> → Sie generiert Inhalte, die ohne manuelle Anpassung funktionieren
>
> Der Redakteur tippt nicht mehr.
> Er steuert, prüft, kuratiert.
>
> Die Stunde, die er vorher mit Formatierung verbracht hat?
> Investiert er jetzt in bessere Geschichten.
>
> Das ist kein Zukunftsszenario.
> Das läuft bei uns in Produktion.
>
> 🎯 Wer ein sauberes Design System hat, hat den Grundstein für AI-enabled Content Operations gelegt. Wer keins hat, automatisiert Chaos.
>
> Stimmt ihr zu? Oder sehe ich das zu schwarz-weiß?

**Hashtags:** `#AIenabledCMS` `#ContentOperations` `#kickstartDS` `#FutureOfContent` `#DesignSystem`

---

#### Freitag W3 – 🎥 Video + CTA

**Thema:** Zusammenfassung der Kampagne + Einladung zum Austausch

> **Hook:** „3 Wochen, 9 Posts, 1 Frage: Wie intelligent ist euer CMS?"
>
> **Video-Inhalt (90 Sek.):** Schnelle Zusammenschnitte aus den vorherigen Demos → Overlay mit Key Metrics → Persönliches Statement in die Kamera: „Wir glauben, dass Content-Produktion nicht die kreativste Arbeit sein muss. Aber die Ergebnisse sollten es sein."
>
> **Text:**
>
> In den letzten 3 Wochen haben wir gezeigt:
>
> ✅ 50 Landing Pages in 50 Minuten generieren
> ✅ Website-Relaunch: Content-Migration per KI statt Copy-Paste
> ✅ Blog-Drafts automatisch aus RSS-Feeds erstellen
> ✅ Content-Audits wöchentlich auf Autopilot
> ✅ SEO-Checks, die sich selbst fixen
> ✅ 12 Workflows, die euer Content-Team entlasten
>
> Alles Open Source. Alles auf eurem eigenen Stack.
> Storyblok + kickstartDS + MCP + n8n.
>
> 👉 Interesse an einer Live-Demo? Kommentar oder DM genügt.
> 👉 GitHub-Repo in den Kommentaren.
>
> **CTA:** „Kommentar: ‚Demo' – und wir melden uns."

**Hashtags:** `#AIenabledCMS` `#ContentOperations` `#kickstartDS` `#OpenSource` `#LiveDemo`

---

## Begleitmaßnahmen

### Verstärkung der Reichweite

| Maßnahme                    | Details                                                                                                                                              |
| --------------------------- | ---------------------------------------------------------------------------------------------------------------------------------------------------- |
| **Personal Branding**       | Jonas (Tech Lead) + Daniel (Gründer/Designer) posten Di+Do persönliche Perspektive – siehe [Flankierender Plan](marketing-plan-personal-branding.md) |
| **Engagement-Strategie**    | Erste 60 Min. nach Veröffentlichung: aktiv auf Kommentare antworten, in relevanten Gruppen teilen                                                    |
| **Cross-Posting (gekürzt)** | Twitter/X: Hook + Link zum LinkedIn-Post; Bluesky: gleicher Ansatz                                                                                   |
| **Community-Tagging**       | In jedem Post 2–3 relevante Personen taggen (Storyblok-Team, n8n-Community, Design-System-Leute)                                                     |
| **Kommentar-Seeding**       | Erste inhaltliche Frage als eigenen Kommentar posten, um Diskussion zu starten                                                                       |

### Content-Assets vorbereiten

| Asset                        | Format / Tool                       | Verantwortlich | Deadline           |
| ---------------------------- | ----------------------------------- | -------------- | ------------------ |
| Carousel-Slides (6 pro Post) | Figma / Canva, 1080×1350px          | Design         | 3 Tage vor Post    |
| Screen-Recordings (3 Videos) | OBS / Loom, 1080p, max. 90 Sek.     | Tech Lead      | 3 Tage vor Post    |
| Untertitel für Videos        | Auto-generated + manuell korrigiert | Marketing      | 1 Tag vor Post     |
| Hook-Texte + Begleittexte    | Dieses Dokument als Vorlage         | Marketing      | 2 Tage vor Post    |
| GitHub-Repo aufräumen        | README aktualisieren, Demo-Branch   | Engineering    | Vor Kampagnenstart |

### Erfolgsmessung (KPIs)

| KPI                          | Ziel (3 Wochen) |
| ---------------------------- | --------------- |
| Impressions (gesamt)         | > 50.000        |
| Engagement Rate (Ø pro Post) | > 3 %           |
| Kommentare (gesamt)          | > 100           |
| Profil-Besuche               | > 500           |
| DMs / Demo-Anfragen          | > 10            |
| GitHub Repo Stars (Zuwachs)  | > 30            |
| Newsletter-Anmeldungen       | > 20            |

---

## Zusammenfassung: Post-Übersicht

| #   | Tag         | Format            | Thema                                            |
| --- | ----------- | ----------------- | ------------------------------------------------ |
| 1   | Mo, Woche 1 | 🎠 Carousel       | Bulk-Seiten-Generierung vs. manuell              |
| 2   | Mi, Woche 1 | 🎥 Video          | Live-Demo: Idee → CMS-Seite in 2 Min.            |
| 3   | Fr, Woche 1 | 💬 Thought Leader | „Dein CMS ist so schlau wie ein leeres Textfeld" |
| 4   | Mo, Woche 2 | 🎠 Carousel       | Website-Relaunch: Content-Migration per KI       |
| 5   | Mi, Woche 2 | 🎠 Carousel       | Automatischer Content-Audit                      |
| 6   | Fr, Woche 2 | 🎥 Video          | Blog-Autopilot aus RSS-Feed                      |
| 7   | Mo, Woche 3 | 🎠 Carousel       | 12 Workflows auf einer Slide                     |
| 8   | Mi, Woche 3 | 💬 Thought Leader | „Der Redakteur der Zukunft ist ein Kurator"      |
| 9   | Fr, Woche 3 | 🎥 Video + CTA    | Zusammenfassung + Demo-Einladung                 |

---

> **Rhythmus-Muster:** Carousel (Montag) → Video oder Carousel (Mittwoch) → Thought Leadership oder Video (Freitag). So wechseln sich informative, demonstrative und meinungsstarke Formate ab – das hält die Zielgruppe engaged, ohne repetitiv zu wirken.
