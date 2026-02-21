# Neue Seite von Grund auf erstellen

## Wann verwenden

Der Editor möchte eine neue Seite in Storyblok erstellen und beschreibt den gewünschten Inhalt in natürlicher Sprache – z.B. _„Erstelle eine Landing Page für unser neues Produkt mit Hero, Features und FAQ"_.

## Voraussetzungen

- Der Editor hat eine grobe Vorstellung vom Seiteninhalt (Thema, Zweck, Zielgruppe)
- Optional: Texte, Bilder oder URLs als Ausgangsmaterial

## Ablauf

### Schritt 0: Bestehende Muster und Rezepte prüfen

- **Tool:** `analyze_content_patterns`
- **Zweck:** Die etablierten Content-Muster dieser Website lernen — welche Komponenten werden häufig verwendet, welche Sektionsabfolgen sind typisch, wie viele Sub-Elemente haben Komponenten normalerweise?
- Antwort kommt sofort aus dem Startup-Cache (kein API-Call). Bei frisch publiziertem Content `refresh: true` übergeben.
- **Alternativ:** Die `recipes://section-recipes` Ressource lesen für allgemeine Best Practices zu Komponentenkombinationen und Seitenvorlagen
- Das Ergebnis als Leitfaden für die Planung nutzen — neue Seiten sollten zum bestehenden Stil der Website passen

### Schritt 1: Verfügbare Komponenten prüfen

- **Tool:** `list_components`
- **Zweck:** Herausfinden, welche Sektionstypen (Hero, FAQ, Testimonials, Features, …) im Design System zur Verfügung stehen
- **Wichtig:** Die Komponentenliste bestimmt, welche `componentType`-Werte in Schritt 2 verwendet werden können. Keine Sektionstypen erfinden, die es nicht gibt!
- Dem Editor die verfügbaren Optionen kurz zusammenfassen und fragen, welche Sektionen die Seite haben soll

### Schritt 1b: Verfügbare Icons prüfen (bei Bedarf)

- **Tool:** `list_icons`
- **Wann:** Wenn die Seite Komponenten mit Icon-Feldern enthalten wird (z.B. Hero mit CTA-Icon, Features mit Icons, Kontaktdaten)
- **Zweck:** Sicherstellen, dass nur gültige Icon-Bezeichner im generierten Inhalt verwendet werden
- **Wichtig:** Icon-Bezeichner nicht erfinden! Nur Werte aus `list_icons` verwenden (z.B. `arrow-right`, `star`, `email`, `phone`)

### Schritt 2: Inhalte generieren

- **Tool:** `generate_content`
- **Empfohlener Ansatz — Sektion für Sektion:**
  Für beste Ergebnisse jede Sektion einzeln generieren statt `sectionCount` zu nutzen:

  1. Sektionsfolge planen (z.B. hero → features → testimonials → cta)
  2. Für jede Sektion: `generate_content` mit `componentType` und sektionsspezifischem Prompt
  3. Alle Sektionen sammeln und zusammen an `create_page_with_content` übergeben
     → Siehe Skill _„Seite Sektion für Sektion planen und erstellen"_ für den detaillierten Ablauf

- **Schneller Ansatz — alles auf einmal:**

  - `sectionCount`: Anzahl der gewünschten Sektionen (nur für ≤ 4 Sektionen empfohlen)
  - `componentType`: Optional, falls nur eine bestimmte Sektion generiert werden soll

- **Für beide Ansätze:**
  - `system`: Einen passenden System-Prompt formulieren, der Tonalität, Zielgruppe und Marke berücksichtigt – z.B. _„Du bist ein erfahrener Content-Autor für eine B2B-Softwarefirma. Schreibe professionell aber zugänglich."_
  - `prompt`: Die Beschreibung des Editors + ggf. bereitgestelltes Material
- **Ergebnis dem Editor zeigen** und fragen, ob Anpassungen nötig sind
- ⚠️ Bei Bedarf `generate_content` mit angepasstem Prompt erneut aufrufen

### Schritt 3: Seite in Storyblok anlegen

- **Tool:** `create_page_with_content`
- **Parameter:**
  - `name`: Seitenname (vom Editor erfragen oder aus Kontext ableiten)
  - `slug`: URL-Slug vorschlagen (z.B. aus dem Seitennamen, Kleinbuchstaben, Bindestriche)
  - `sections`: Die generierten Sektionen aus Schritt 2
  - `uploadAssets: true` ← **immer setzen**, damit KI-generierte Bilder nach Storyblok hochgeladen werden
  - `assetFolderName`: Sinnvollen Ordnernamen vorschlagen (z.B. _„Landing Page - [Thema]"_)
  - `publish: false` ← **immer als Draft**, der Editor soll im Visual Editor prüfen
- ⚠️ `parentId` nur setzen, wenn der Editor explizit einen Ordner nennt
- 💡 Alternativ: `path` verwenden (z.B. `"en/services"`), um Ordner automatisch anlegen zu lassen (wie `mkdir -p`). `path` und `parentId` sind gegenseitig exklusiv.

### Schritt 4: Bestätigung

- Dem Editor den Slug / Link zur neuen Seite nennen
- Darauf hinweisen, dass die Seite als **Draft** vorliegt und im Storyblok Visual Editor geprüft werden sollte
- Fragen, ob weitere Anpassungen gewünscht sind

## Häufige Fehler

| Fehler                         | Auswirkung                                                              | Vermeidung                                                                                                    |
| ------------------------------ | ----------------------------------------------------------------------- | ------------------------------------------------------------------------------------------------------------- |
| `uploadAssets: true` vergessen | Bilder bleiben als externe URLs, brechen evtl. später                   | Immer setzen                                                                                                  |
| `publish: true` ohne Review    | Ungeprüfter Content geht live                                           | Immer `false`, Editor entscheidet                                                                             |
| `list_components` übersprungen | Claude generiert Sektionstypen, die es nicht gibt → Import schlägt fehl | Immer zuerst Komponenten prüfen                                                                               |
| Icon-Bezeichner erfunden       | Ungültige Icons werden nicht gerendert                                  | Immer `list_icons` aufrufen vor Icon-Nutzung                                                                  |
| Slug nicht abgestimmt          | Doppelte Slugs → Storyblok-Fehler                                       | Slug mit Editor besprechen                                                                                    |
| Zu viele Sektionen auf einmal  | Ergebnis schwer zu überblicken                                          | Bei > 4 Sektionen den Sektion-für-Sektion Ansatz verwenden (siehe Skill _„Seite Sektion für Sektion planen"_) |
| Bestehende Muster ignoriert    | Neuer Content passt nicht zum Rest der Website                          | Immer zuerst `analyze_content_patterns` oder Rezepte prüfen                                                   |

## Varianten

- **Nur eine einzelne Sektion generieren:** `componentType` statt `sectionCount` verwenden
- **Seite in einem Unterordner:** `path` verwenden (z.B. `"en/services/consulting"`) — Ordner werden automatisch erstellt. Alternativ `parentId` des Zielordners angeben (über `list_stories` mit `startsWith` ermitteln).
- **Blogpost statt Seite:** `contentType: "blog-post"` bei allen Tools übergeben. Blog-Posts sind Hybrid-Typen mit Sektionen UND Root-Feldern (`head`, `aside`, `cta`, `seo`). **Wichtig:** Blog-Sektionen sollten überwiegend aus `text` und `split-even` bestehen — niemals `hero` oder `cta` als Sektionen verwenden (diese werden über die Root-Felder `head` und `cta` abgedeckt). Andere Komponenten wie `faq` nur ausnahmsweise. Nach den Sektionen `generate_root_field` für jedes Root-Feld und `generate_seo` für SEO-Metadaten aufrufen. Dann `create_page_with_content(sections: [...], rootFields: { head, aside, cta, seo })`. Siehe Skill _„Seite Sektion für Sektion planen und erstellen"_ → Abschnitt Hybrid-Typen.
- **Events:** `contentType: "event-detail"` verwenden. Bei Tier-2-Typen (event-detail, event-list) `rootFields` für die Wurzel-Felder setzen, da keine Sektionen vorhanden sind.
