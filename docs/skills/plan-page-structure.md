# Skill: Seite Sektion für Sektion planen und erstellen

## Wann verwenden

Wenn eine neue Seite mit 3 oder mehr Sektionen erstellt werden soll. Erzeugt deutlich bessere Ergebnisse als `generate_content` mit `sectionCount`, weil jede Sektion individuell aufmerksamkeit bekommt.

## Voraussetzungen

- Der Editor hat eine Vorstellung vom Seiteninhalt (Thema, Zweck, Zielgruppe)
- Optional: Texte, Bilder oder URLs als Ausgangsmaterial

## Ablauf

### Schritt 1: Bestehende Muster analysieren

- **Tool:** `analyze_content_patterns`
- **Zweck:** Die etablierten Muster dieser Website lernen — welche Komponenten werden häufig verwendet, welche Abfolgen sind typisch, wie viele Sub-Elemente haben Komponenten normalerweise?
- Antwort kommt **sofort aus dem Startup-Cache** (kein API-Call). Bei frisch publiziertem Content `refresh: true` übergeben.
- Das Ergebnis als Leitfaden für die Planung nutzen
- Alternativ: `list_recipes` oder die Rezepte-Ressource (`recipes://section-recipes`) als Orientierung verwenden

### Schritt 2: Verfügbare Komponenten prüfen

- **Tool:** `list_components`
- **Zweck:** Die vollständige Palette und Verschachtelungsregeln verstehen
- Die `typicalUsage`-Hinweise pro Komponente beachten — sie enthalten Empfehlungen für Einsatzzweck und typische Sub-Element-Anzahlen

### Schritt 2b: Verfügbare Icons prüfen (bei Bedarf)

- **Tool:** `list_icons`
- **Wann:** Wenn die Seite Komponenten mit Icon-Feldern enthalten wird (z.B. Features, Hero-CTA, Kontakt)
- **Wichtig:** Nur Werte aus `list_icons` verwenden — keine Icons erfinden!

### Schritt 3: Sektionsfolge planen

Basierend auf dem Briefing des Editors + den Website-Mustern eine Sektionsfolge mit 4-7 Sektionen festlegen. Bevorzugt Komponentenabfolgen verwenden, die bereits auf der Website existieren.

- **Tool (optional):** `plan_page` — KI-gestützte Planung auf Basis von Intent und Website-Mustern

**Planungsheuristiken:**

- Mit `hero` oder `video-curtain` für visuellen Impact starten
- `features`, `split` oder `mosaic` für den Kerninhalt folgen lassen
- Social Proof über `testimonials`, `stats` oder `logos-companies` einbauen
- Einwände über `faq` adressieren
- Mit `cta` für Conversion abschließen
- `divider` sparsam zwischen thematischen Wechseln einsetzen
- Sub-Element-Anzahlen an die Website-Normen anpassen (aus `analyze_content_patterns`)

**Beispielplan:**

```
1. hero — Produkt mit starkem Visual vorstellen (2 Buttons)
2. features — 4 Hauptvorteile mit Icons
3. split — Detaillierte Demo mit Screenshot
4. testimonials — 3 Kundenstimmen
5. cta — Kostenlose Demo anfragen (1-2 Buttons)
```

Diesen Plan dem Editor vorstellen und bestätigen lassen.

### Schritt 4: Jede Sektion einzeln generieren

Für JEDE geplannte Sektion `generate_section` separat aufrufen:

- **Tool:** `generate_section`
- **Parameter:**
  - `componentType`: Der Sektionstyp aus dem Plan (z.B. `"hero"`)
  - `prompt`: Eine Beschreibung für NUR diese Sektion — was soll sie kommunizieren?
  - `previousSection` / `nextSection`: Typ der Nachbar-Sektionen für Übergangshinweise
    (z.B. `previousSection: "hero"`, `nextSection: "testimonials"`)

**Vorteile von `generate_section`:** Site-Kontext (Sub-Item-Counts, Komponentenfrequenz, Rezept-Best-Practices) wird automatisch in den System-Prompt injiziert.

**Wichtig:** Nicht alle Sektionen mit demselben generischen Prompt generieren — jede Sektion braucht eine spezifische Beschreibung für gute Ergebnisse.

### Schritt 5: Seite zusammenbauen und erstellen

Alle generierten Sektionen in einem Array zusammenführen.

- **Tool:** `create_page_with_content`
- **Parameter:**
  - `name`: Seitenname (mit Editor abstimmen)
  - `slug`: URL-Slug vorschlagen
  - `sections`: Das kombinierte Array aller Sektionen
  - `uploadAssets: true` ← **immer setzen** bei KI-generierten Bildern
  - `assetFolderName`: Sinnvollen Ordnernamen vorschlagen
  - `publish: false` ← als Draft, Editor prüft im Visual Editor

### Schritt 6: Bestätigung

- Den Storyblok-Editor-Link teilen
- Auf den Draft-Status hinweisen
- Fragen, ob Anpassungen gewünscht sind

## Häufige Fehler

| Fehler                                               | Warum problematisch                                     | Vermeidung                                           |
| ---------------------------------------------------- | ------------------------------------------------------- | ---------------------------------------------------- |
| `sectionCount` bei 5+ Sektionen nutzen               | Schema zu groß, OpenAI trifft schlechte Komponentenwahl | Sektion für Sektion generieren                       |
| Bestehende Muster nicht geprüft                      | Neuer Content passt nicht zum Rest der Website          | Immer `analyze_content_patterns` oder Rezepte zuerst |
| Alle Sektionen mit gleichem Prompt                   | Jede Sektion braucht spezifische Anweisungen            | Individuelle Prompts pro Sektion                     |
| `list_icons` übersprungen                            | Ungültige Icon-Bezeichner im generierten Content        | Immer vor Icon-Nutzung aufrufen                      |
| `uploadAssets: true` vergessen                       | Bilder bleiben als externe URLs                         | Immer setzen                                         |
| Zwei Hero-Sektionen auf einer Seite                  | Verwirrt die visuelle Hierarchie                        | Maximal eine Hero/Video-Curtain pro Seite            |
| Gleiche Komponente in aufeinanderfolgenden Sektionen | Visuelle Monotonie                                      | Layout zwischen Sektionen variieren                  |

## Vergleich: Sektion-für-Sektion vs. sectionCount

| Aspekt                    | Sektion-für-Sektion                        | `sectionCount`                          |
| ------------------------- | ------------------------------------------ | --------------------------------------- |
| Komponentenwahl           | LLM wählt bewusst basierend auf Kontext    | OpenAI wählt aus riesigem Schema        |
| Sub-Element-Anzahl        | Kontrolliert pro Sektion                   | Oft zu viele oder zu wenige             |
| Konsistenz mit Website    | Kann an bestehende Muster angepasst werden | Keine Awareness für bestehenden Content |
| Qualität bei 5+ Sektionen | Gleichbleibend hoch                        | Nimmt deutlich ab                       |
| Aufwand                   | Mehr Tool-Calls                            | Ein einziger Call                       |
| Empfehlung                | ✅ Für Produktion                          | ⚠️ Nur für schnelle Prototypen          |
