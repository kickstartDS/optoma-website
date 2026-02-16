# Skill: Webseite migrieren (URL → Storyblok-Seite)

## Wann verwenden

Der Editor möchte Inhalte von einer externen Webseite übernehmen – z.B. bei einem Relaunch, einer Content-Migration oder um Inhalte von einer anderen Quelle als Ausgangspunkt zu nutzen.

## Voraussetzungen

- Eine öffentlich erreichbare URL der Quellseite
- Falls die Seite Login-geschützt ist: Der Editor muss den Text manuell bereitstellen (→ siehe Variante unten)

## Ablauf

### Schritt 1: Quelle scrapen

- **Tool:** `scrape_url`
- **Parameter:**
  - `url`: Die URL der zu migrierenden Seite
  - `selector`: Optional, falls nur ein Bereich relevant ist (z.B. `"article"`, `"main"`, `".content"`)
- **Ergebnis:** Sauberes Markdown mit Text und Bild-URLs
- Dem Editor eine kurze Zusammenfassung zeigen: _„Die Seite enthält: Überschrift, 3 Absätze Text, 2 Bilder, eine Liste"_
- ⚠️ Falls der Scrape fehlschlägt (403, Captcha, JS-only-Seite): Den Editor bitten, den Text direkt in den Chat zu kopieren

### Schritt 2: Verfügbare Komponenten prüfen

- **Tool:** `list_components`
- **Zweck:** Entscheiden, welche Design-System-Sektionen am besten zum gescrapten Inhalt passen
- Z.B.: Überschrift + Bild → Hero; Aufzählung → Features oder FAQ; Fließtext → Text/Bild-Sektion
- Dem Editor die geplante Zuordnung kurz vorstellen
- **Tool:** `analyze_content_patterns`
- **Zweck:** Die bestehenden Muster der Zielwebsite kennenlernen und die migrierte Seitenstruktur daran angleichen (Antwort kommt sofort aus dem Startup-Cache)
- **Alternativ:** Die `recipes://section-recipes` Ressource lesen, um die gescrapte Seitenstruktur auf passende Rezepte abzubilden

### Schritt 2b: Verfügbare Icons prüfen (bei Bedarf)

- **Tool:** `list_icons`
- **Wann:** Wenn die Quellseite Icons enthält oder die Zielkomponenten Icon-Felder haben (z.B. Features, CTAs)
- **Zweck:** Nur gültige Icon-Bezeichner verwenden – die Icons der Quellseite müssen auf verfügbare Bezeichner gemappt werden

### Schritt 3: Inhalte in Design-System-Struktur umwandeln

- **Tool:** `generate_content`
- **Parameter:**
  - `system`: _„Du bist ein Content-Architekt. Strukturiere den folgenden Website-Inhalt in Design-System-Sektionen. Behalte den Inhalt so nah wie möglich am Original, passe aber die Struktur an die verfügbaren Komponenten an."_
  - `prompt`: Das Markdown aus Schritt 1, ggf. mit Hinweisen des Editors (z.B. _„Lass den Footer-Text weg"_, _„Ändere den Firmennamen auf XYZ"_)
  - `sectionCount`: Aus der Markdown-Struktur ableiten (z.B. 1 Hero + 2–3 Inhaltssektionen + 1 CTA)
- **Ergebnis dem Editor zeigen** – besonders bei Migrationen ist ein Review-Schritt wichtig, da KI-Umstrukturierung vom Original abweichen kann

### Schritt 4: Seite in Storyblok anlegen

- **Tool:** `create_page_with_content`
- **Parameter:**
  - `name`: Seitenname (aus dem Titel der Quellseite ableiten oder vom Editor erfragen)
  - `slug`: URL-Slug vorschlagen
  - `sections`: Die umstrukturierten Sektionen aus Schritt 3
  - `uploadAssets: true` ← **kritisch bei Migration**, damit Bilder von der Quellseite nach Storyblok kopiert werden
  - `assetFolderName`: Z.B. _„Migration - example.com"_ oder _„Relaunch - [Projektname]"_
  - `publish: false` ← Draft, Editor prüft
  - `path`: Optional, z.B. `"migration/example-com"` — legt Ordnerhierarchie automatisch an (wie `mkdir -p`)
- ⚠️ Ohne `uploadAssets: true` verweisen Bilder weiterhin auf die alte Domain – brechen nach Abschaltung!

### Schritt 5: Qualitätsprüfung

- Dem Editor den Link zur neuen Draft-Seite geben
- Checkliste ansprechen:
  - ✅ Wurden alle Bilder korrekt übernommen?
  - ✅ Stimmt die Textstruktur?
  - ✅ Fehlen Inhalte, die auf der Quellseite waren?
  - ✅ Müssen Texte aktualisiert werden (Jahreszahlen, Firmennamen, …)?

## Häufige Fehler

| Fehler                                 | Auswirkung                                               | Vermeidung                                    |
| -------------------------------------- | -------------------------------------------------------- | --------------------------------------------- |
| `uploadAssets: true` vergessen         | Bilder verweisen auf alte Domain, brechen nach Migration | Immer setzen bei URL-Migration                |
| Keinen `selector` bei komplexen Seiten | Scrape enthält Navigation, Cookie-Banner etc.            | `selector: "main"` oder `"article"` verwenden |
| Markdown-Output nicht geprüft          | Kaputtes Markdown → schlechte KI-Generierung             | Scrape-Ergebnis immer kurz prüfen             |
| 1:1-Übernahme erwartet                 | KI strukturiert um, Ergebnis weicht vom Original ab      | Editor vorab darauf hinweisen                 |
| Zu viele Seiten auf einmal             | Kontext geht verloren, Qualität sinkt                    | Seite für Seite migrieren                     |

## Varianten

- **Text direkt aus dem Chat:** Falls kein Scrape möglich, kann der Editor den Text einfach einfügen → Schritt 1 überspringen, direkt zu Schritt 3 mit dem eingefügten Text als Prompt
- **Bulk-Migration:** Für viele Seiten besser einen n8n-Workflow verwenden (siehe Content Operations Workflows Dokument). Ordnerstruktur vorab mit `ensure_path` anlegen, dann Seiten parallel erstellen.
- **Nur Inhalte extrahieren, nicht anlegen:** Schritte 1–3 durchführen und dem Editor das Ergebnis als JSON zeigen, ohne Storyblok-Import
- **Zu bestehender Seite hinzufügen:** Statt `create_page_with_content` in Schritt 4 → `import_content_at_position` verwenden (siehe Skill „Bestehende Seite erweitern")
