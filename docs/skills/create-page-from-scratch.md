# Skill: Neue Seite von Grund auf erstellen

## Wann verwenden

Der Editor möchte eine neue Seite in Storyblok erstellen und beschreibt den gewünschten Inhalt in natürlicher Sprache – z.B. _„Erstelle eine Landing Page für unser neues Produkt mit Hero, Features und FAQ"_.

## Voraussetzungen

- Der Editor hat eine grobe Vorstellung vom Seiteninhalt (Thema, Zweck, Zielgruppe)
- Optional: Texte, Bilder oder URLs als Ausgangsmaterial

## Ablauf

### Schritt 1: Verfügbare Komponenten prüfen

- **Tool:** `list_components`
- **Zweck:** Herausfinden, welche Sektionstypen (Hero, FAQ, Testimonials, Features, …) im Design System zur Verfügung stehen
- **Wichtig:** Die Komponentenliste bestimmt, welche `componentType`-Werte in Schritt 2 verwendet werden können. Keine Sektionstypen erfinden, die es nicht gibt!
- Dem Editor die verfügbaren Optionen kurz zusammenfassen und fragen, welche Sektionen die Seite haben soll

### Schritt 2: Inhalte generieren

- **Tool:** `generate_content`
- **Parameter:**
  - `system`: Einen passenden System-Prompt formulieren, der Tonalität, Zielgruppe und Marke berücksichtigt – z.B. _„Du bist ein erfahrener Content-Autor für eine B2B-Softwarefirma. Schreibe professionell aber zugänglich."_
  - `prompt`: Die Beschreibung des Editors + ggf. bereitgestelltes Material
  - `sectionCount`: Anzahl der gewünschten Sektionen (aus dem Gespräch ableiten)
  - `componentType`: Optional, falls nur eine bestimmte Sektion generiert werden soll
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

### Schritt 4: Bestätigung

- Dem Editor den Slug / Link zur neuen Seite nennen
- Darauf hinweisen, dass die Seite als **Draft** vorliegt und im Storyblok Visual Editor geprüft werden sollte
- Fragen, ob weitere Anpassungen gewünscht sind

## Häufige Fehler

| Fehler                         | Auswirkung                                                              | Vermeidung                                       |
| ------------------------------ | ----------------------------------------------------------------------- | ------------------------------------------------ |
| `uploadAssets: true` vergessen | Bilder bleiben als externe URLs, brechen evtl. später                   | Immer setzen                                     |
| `publish: true` ohne Review    | Ungeprüfter Content geht live                                           | Immer `false`, Editor entscheidet                |
| `list_components` übersprungen | Claude generiert Sektionstypen, die es nicht gibt → Import schlägt fehl | Immer zuerst Komponenten prüfen                  |
| Slug nicht abgestimmt          | Doppelte Slugs → Storyblok-Fehler                                       | Slug mit Editor besprechen                       |
| Zu viele Sektionen auf einmal  | Ergebnis schwer zu überblicken                                          | Bei > 5 Sektionen lieber schrittweise generieren |

## Varianten

- **Nur eine einzelne Sektion generieren:** `componentType` statt `sectionCount` verwenden
- **Seite in einem Unterordner:** `parentId` des Zielordners angeben (über `list_stories` mit `startsWith` ermitteln)
- **Blogpost statt Seite:** Anderen Content-Typ verwenden, ggf. `create_story` direkt nutzen
