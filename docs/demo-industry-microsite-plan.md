# Demo Micro-Site Plan: FALKENBERG Precision GmbH

## Purpose

This document defines the concept, content structure, and page-by-page generation plan for a **fictional industrial manufacturing company** micro-site. The site serves as a showcase for the **ruhmesmeile CMS Website-Accelerator** targeted at German industrial customers ("Fertigungs- / Industrieunternehmen").

All pages will be created under the Storyblok slug/folder **`industry`** using the MCP server's `plan_page` → `generate_section` → `create_page_with_content` workflow.

---

## Company Profile: FALKENBERG Precision GmbH

### Identity

| Field            | Value                                      |
| ---------------- | ------------------------------------------ |
| **Name**         | FALKENBERG Precision GmbH                  |
| **Founded**      | 1983                                       |
| **Headquarters** | Stuttgart, Germany                         |
| **Employees**    | ~420                                       |
| **Revenue**      | €78M (2025)                                |
| **Industry**     | Industrial Sensors & Precision Measurement |
| **Tagline**      | "Precision That Drives Industry Forward"   |
| **Website Slug** | `industry`                                 |

### Company Story

FALKENBERG Precision was founded in 1983 by Klaus Falkenberg, a mechanical engineer who left a large sensor manufacturer to develop his own line of high-precision measurement instruments. Starting in a small workshop in Stuttgart-Vaihingen, the company grew through relentless focus on accuracy and reliability.

Today, FALKENBERG is a recognized name in industrial metrology and sensor technology. The company develops, manufactures, and distributes precision sensors, measurement systems, and quality inspection solutions for industries ranging from automotive to aerospace, pharmaceuticals to energy.

As a classic German Mittelstand company, FALKENBERG combines engineering excellence with a family-business culture, now led by second-generation CEO Dr. Lena Falkenberg. The company operates manufacturing facilities in Stuttgart and Tübingen, with sales offices in Munich, Hamburg, and international representatives in 30+ countries.

### Core Values

- **Precision** — Accuracy down to the micron, in products and processes
- **Reliability** — Trusted by the world's most demanding industries for 40+ years
- **Innovation** — Continuous R&D investment (12% of revenue) driving Industry 4.0 solutions
- **Partnership** — Long-term customer relationships, not just transactions

### Product Portfolio

| Category                    | Description                                                                             | Key Industries          |
| --------------------------- | --------------------------------------------------------------------------------------- | ----------------------- |
| **Precision Sensors**       | High-accuracy inductive, capacitive, and optical sensors for automated production lines | Automotive, Electronics |
| **Measurement Systems**     | Complete measurement and inspection systems for quality control and process monitoring  | Aerospace, Pharma       |
| **Industrial IoT Gateways** | Smart sensor hubs connecting legacy equipment to modern data platforms (Industry 4.0)   | All industries          |
| **Calibration Services**    | ISO 17025-accredited calibration laboratory for sensors and measurement instruments     | All industries          |

### Key Differentiators

1. **German Engineering, Global Reach** — Designed and manufactured in Baden-Württemberg, deployed in 30+ countries
2. **Industry 4.0 Pioneer** — One of the first sensor manufacturers to offer IoT-ready products with open API interfaces
3. **Full-Stack Metrology** — From single sensors to complete measurement systems, including calibration services
4. **Extreme Precision** — Measurement accuracy down to ±0.1 µm in optical systems
5. **Long Lifecycle Support** — 15+ year product support commitment, critical for industrial customers

### Target Customers

- Production managers and quality engineers at manufacturing plants
- C-level executives evaluating digital transformation / Industry 4.0 investments
- OEM integration partners building measurement into their machines
- Research & development labs in universities and research institutions

---

## Micro-Site Architecture

### Page Overview

| #   | Page                  | Slug                 | Template Type       | Purpose                                               |
| --- | --------------------- | -------------------- | ------------------- | ----------------------------------------------------- |
| 1   | **Homepage**          | `industry`           | Trust-Heavy Landing | Company introduction, key capabilities, trust signals |
| 2   | **Products**          | `industry/products`  | Product Landing     | Product portfolio overview with category teasers      |
| 3   | **Solutions**         | `industry/solutions` | Service Detail      | Industry-specific application stories                 |
| 4   | **About Us**          | `industry/about`     | Company About       | Company history, values, team, facilities             |
| 5   | **Service & Support** | `industry/service`   | Service Detail      | Calibration, training, technical support, spare parts |
| 6   | **Contact**           | `industry/contact`   | Minimal + Contact   | Contact form, office locations, sales representatives |

### Navigation Structure

```
FALKENBERG Precision
├── Products
├── Solutions
├── About Us
├── Service & Support
└── Contact
```

---

## Page-by-Page Content Plan

Each page plan includes: the page intent (for `plan_page`), the recommended section sequence, and detailed content briefs per section (for `generate_section` prompts). The section sequences are based on the established patterns from `analyze_content_patterns` and curated recipes from `list_recipes`.

### Conventions

- **Icons** — Only use valid identifiers from `list_icons`: `arrow-right`, `star`, `email`, `phone`, `map-pin`, `download`, `search`, `home`, `person`, `date`, `time`, `file`, `login`, `upload`, `map`
- **Buttons** — Hero: 1–2 buttons; CTA: 1–2 buttons; as per site median
- **Features** — 3–4 items per features section (site median: 6, but 3–4 per recipe recommendation)
- **Stats** — 3–4 stat items per section
- **Testimonials** — 2–3 per section
- **FAQ** — 5–8 questions per section
- **Images** — All external images require `uploadAssets: true` when creating pages
- **Asset Folder** — Use `assetFolderName: "FALKENBERG Precision"` for all pages
- **Path** — Use `path: "industry"` for the homepage, and `path: "industry/{slug}"` for subpages

---

### Page 1: Homepage

**Slug:** `industry`
**Intent:** "Corporate homepage for a German precision sensor manufacturer. Establish credibility, showcase product range, highlight Industry 4.0 capabilities, and convert visitors to contact or product exploration."

**Section Sequence:**

| #   | Component      | Section Role           |
| --- | -------------- | ---------------------- |
| 1   | `hero`         | Brand introduction     |
| 2   | `features`     | Key capabilities       |
| 3   | `stats`        | Company achievements   |
| 4   | `split`        | Industry 4.0 spotlight |
| 5   | `testimonials` | Customer validation    |
| 6   | `logos`        | Client logo wall       |
| 7   | `cta`          | Primary conversion     |

**Section Content Briefs:**

#### 1. Hero

- **Headline:** "Precision That Drives Industry Forward"
- **Sub-headline:** "High-performance sensors and measurement systems for the world's most demanding manufacturing environments. Engineered in Germany since 1983."
- **Image:** Industrial facility interior with precision measurement equipment, clean and modern aesthetic
- **Buttons:** "Explore Products" (primary, links to /industry/products), "Request a Consultation" (secondary, links to /industry/contact)
- **Note:** Set `hero.buttons` count to 2

#### 2. Features — Core Capabilities

- **Section headline:** "Engineering Excellence Across Every Product Line"
- **4 Feature items:**
  1. **Precision Sensors** — "Inductive, capacitive, and optical sensors with accuracy down to ±0.1 µm" — Icon: `star`
  2. **Measurement Systems** — "Complete quality inspection solutions for automated production" — Icon: `search`
  3. **Industrial IoT** — "Smart gateways connecting your machines to modern data platforms" — Icon: `upload`
  4. **Calibration Services** — "ISO 17025-accredited laboratory ensuring traceable accuracy" — Icon: `file`

#### 3. Stats — Company in Numbers

- **4 Stat items:**
  1. "40+" — "Years of Precision Engineering"
  2. "30+" — "Countries Served Worldwide"
  3. "±0.1 µm" — "Measurement Accuracy"
  4. "15+" — "Years Product Lifecycle Support"

#### 4. Split — Industry 4.0 Spotlight

- **Headline:** "Industry 4.0 Ready: From Sensor to Cloud"
- **Text:** "Our Industrial IoT Gateways bridge the gap between legacy equipment and modern data platforms. Connect any sensor — ours or third-party — to your MES, ERP, or cloud analytics in minutes, not months. Open APIs, edge computing, and OPC UA support built in."
- **Image:** Visualization of sensor data flowing from factory floor to cloud dashboard
- **Button:** "Learn More About Our IoT Solutions" → /industry/solutions

#### 5. Testimonials — Customer Voices

- **2–3 testimonials:**
  1. **Dr. Stefan Müller**, Head of Quality, Automotive Tier-1 Supplier — "FALKENBERG sensors have been the backbone of our inline quality inspection for over 15 years. Their accuracy and long-term stability are unmatched."
  2. **Ing. Maria Rossi**, Production Director, Italian Aerospace Manufacturer — "When we needed to digitize our legacy measurement equipment, FALKENBERG's IoT gateway was the only solution that integrated seamlessly with our existing infrastructure."
  3. **Prof. Thomas Weber**, Technical University of Munich — "For our research lab, we rely on FALKENBERG calibration services. Their ISO 17025 accreditation and fast turnaround make them our preferred partner."

#### 6. Logos — Trusted By Industry Leaders

- **8 logos** (fictional company logos / placeholder text): "Leading automotive OEMs, aerospace manufacturers, pharmaceutical companies, and research institutions trust FALKENBERG precision."
- **Note:** Since these are fictional, use placeholder descriptive text. When creating in Storyblok, images can be added later.

#### 7. CTA — Contact Conversion

- **Headline:** "Ready to Elevate Your Measurement Precision?"
- **Text:** "Whether you're upgrading existing systems or planning a new production line, our engineering team is ready to help you find the optimal sensor and measurement solution."
- **Buttons:** "Get in Touch" (primary, → /industry/contact), "Download Product Catalog" (secondary)

---

### Page 2: Products

**Slug:** `industry/products`
**Intent:** "Product portfolio overview for a precision sensor manufacturer. Present four main product categories with enough detail to drive exploration, while building confidence in the breadth and depth of the product range."

**Section Sequence:**

| #   | Component  | Section Role                             |
| --- | ---------- | ---------------------------------------- |
| 1   | `hero`     | Products page opener                     |
| 2   | `features` | Product range overview                   |
| 3   | `split`    | Featured product deep-dive (Sensors)     |
| 4   | `split`    | Featured product deep-dive (IoT Gateway) |
| 5   | `stats`    | Product performance data                 |
| 6   | `faq`      | Technical questions                      |
| 7   | `cta`      | Request quote / catalog                  |

**Section Content Briefs:**

#### 1. Hero

- **Headline:** "Precision Products for Every Measurement Challenge"
- **Sub-headline:** "From single sensors to complete measurement systems — engineered for maximum accuracy, reliability, and ease of integration."
- **Image:** Array of precision sensors and measurement instruments on a clean white surface
- **Buttons:** "Request a Quote" (primary, → /industry/contact)

#### 2. Features — Product Categories

- **Section headline:** "Our Product Portfolio"
- **4 Feature items:**
  1. **Precision Sensors** — "High-accuracy inductive, capacitive, and optical sensors for automated production. Ranges from sub-micron to meters." — Icon: `star`
  2. **Measurement Systems** — "Turnkey inspection solutions: sensor arrays, controllers, software, and integration. Inline and offline." — Icon: `search`
  3. **Industrial IoT Gateways** — "Connect any sensor to any platform. OPC UA, MQTT, REST APIs. Edge computing built-in." — Icon: `upload`
  4. **Calibration Equipment** — "Reference standards and portable calibration tools for in-house metrology labs." — Icon: `file`

#### 3. Split — Precision Sensors Deep-Dive

- **Headline:** "Precision Sensors: Accuracy Down to ±0.1 µm"
- **Text:** "Our flagship sensor line covers inductive displacement sensors (eddy current), capacitive gap sensors, optical triangulation sensors, and confocal chromatic sensors. Each product line is optimized for specific measurement tasks — from nanometer-resolution surface profiling to millimeter-range displacement monitoring in harsh industrial environments. All sensors feature EMC-hardened electronics, IP67/IP69K housings, and operating temperatures from -40°C to +120°C."
- **Image:** Close-up of a precision optical sensor mounted on a measurement rig
- **Button:** "View Sensor Catalog" → (external link placeholder)

#### 4. Split — IoT Gateway Deep-Dive

- **Headline:** "FalkenConnect IoT Gateway: Your Bridge to Industry 4.0"
- **Text:** "The FalkenConnect IIoT Gateway transforms any sensor installation into a smart data source. Plug in up to 64 analog and digital sensors, configure data processing on the edge, and stream results to your MES, cloud platform, or data lake. Supports OPC UA, MQTT, REST, and Modbus protocols. Includes a web-based configuration UI — no programming required."
- **Image:** IoT gateway device with sensor cables connected, dashboard visible on a tablet
- **Button:** "Explore FalkenConnect" → /industry/solutions

#### 5. Stats — Performance Numbers

- **4 Stat items:**
  1. "±0.1 µm" — "Best-in-Class Sensor Accuracy"
  2. "64" — "Sensor Channels per IoT Gateway"
  3. "IP69K" — "Maximum Protection Rating"
  4. "-40° to +120°C" — "Operating Temperature Range"

#### 6. FAQ — Technical Questions

- **6 Questions:**
  1. "What sensor technology is best for my application?" — "The optimal choice depends on your target material, measurement range, accuracy requirements, and environmental conditions. Our inductive sensors excel on metallic targets, capacitive sensors on any conductive material, and optical sensors provide non-contact measurement on virtually any surface. Contact our application engineers for a free recommendation."
  2. "Can FALKENBERG sensors integrate with our existing PLC/controller?" — "Yes. All our sensors provide industry-standard analog outputs (0–10V, 4–20mA) and digital interfaces (IO-Link, EtherCAT, PROFINET). The FalkenConnect gateway adds MQTT, OPC UA, and REST API connectivity for modern platforms."
  3. "What is the typical lead time for standard products?" — "Standard catalog products ship within 5–10 business days from our Stuttgart warehouse. Custom configurations require 4–8 weeks depending on complexity."
  4. "Do you offer on-site installation and commissioning?" — "Yes. Our field service engineers are available worldwide for installation, commissioning, and training. We also offer remote commissioning support via secure video link."
  5. "How often should sensors be recalibrated?" — "We recommend annual recalibration for most applications, or every 6 months in high-precision or regulated environments. Our ISO 17025 calibration lab provides fast turnaround with traceable certificates."
  6. "What warranty do you provide?" — "All FALKENBERG products come with a standard 3-year warranty. Extended warranty and lifecycle support contracts of up to 15 years are available."

#### 7. CTA

- **Headline:** "Find the Right Measurement Solution"
- **Text:** "Our application engineers will help you select the optimal sensor or system for your specific measurement challenge."
- **Buttons:** "Request a Quote" (primary, → /industry/contact), "Download Product Catalog" (secondary)

---

### Page 3: Solutions

**Slug:** `industry/solutions`
**Intent:** "Industry-specific solutions page showcasing how FALKENBERG products solve real-world measurement challenges across automotive, aerospace, pharma, and energy sectors. Focus on use cases and business outcomes, not just product specs."

**Section Sequence:**

| #   | Component      | Section Role             |
| --- | -------------- | ------------------------ |
| 1   | `hero`         | Solutions page opener    |
| 2   | `features`     | Industry overview        |
| 3   | `split`        | Automotive use case      |
| 4   | `split`        | Aerospace use case       |
| 5   | `split`        | Pharma use case          |
| 6   | `testimonials` | Customer success stories |
| 7   | `cta`          | Consultation booking     |

**Section Content Briefs:**

#### 1. Hero

- **Headline:** "Measurement Solutions for Every Industry"
- **Sub-headline:** "From automotive inline inspection to pharmaceutical compliance monitoring — we solve the most demanding measurement challenges across manufacturing sectors worldwide."
- **Image:** Collage or wide-angle shot of various industrial environments: car body measurement, cleanroom, turbine inspection
- **Buttons:** "Talk to Our Engineers" (primary, → /industry/contact)

#### 2. Features — Industry Verticals

- **Section headline:** "Industries We Serve"
- **4 Feature items:**
  1. **Automotive** — "Inline body-in-white measurement, gap & flush inspection, powertrain quality control" — Icon: `star`
  2. **Aerospace** — "Turbine blade profiling, composite thickness measurement, non-destructive testing integration" — Icon: `search`
  3. **Pharmaceuticals** — "Fill level monitoring, vial inspection, cleanroom-compatible sensors with FDA 21 CFR Part 11 support" — Icon: `file`
  4. **Energy** — "Wind turbine bearing monitoring, solar panel flatness inspection, battery cell quality control" — Icon: `upload`

#### 3. Split — Automotive Use Case

- **Headline:** "Automotive: 100% Inline Inspection at Line Speed"
- **Text:** "A leading European automotive OEM integrated 128 FALKENBERG optical sensors into their body-in-white welding line, enabling 100% gap and flush measurement at full production speed. The result: scrap reduction of 34%, warranty claims down by 22%, and complete digital traceability of every vehicle body produced. The FalkenConnect gateway streams all measurement data to the plant's MES in real time."
- **Image:** Automotive production line with sensor equipment measuring a car body
- **Button:** "Explore Automotive Solutions"

#### 4. Split — Aerospace Use Case

- **Headline:** "Aerospace: Micron-Level Precision for Turbine Blades"
- **Text:** "A major turbine manufacturer uses FALKENBERG confocal chromatic sensors for 100% surface profiling of high-pressure turbine blades. With ±0.25 µm accuracy and non-contact measurement, the system inspects critical airfoil geometry without risk of surface damage. Integrated into a 5-axis robotic cell, the solution measures a complete blade in under 90 seconds."
- **Image:** Close-up of a turbine blade being measured by an optical sensor system
- **Button:** "Explore Aerospace Solutions"

#### 5. Split — Pharmaceuticals Use Case

- **Headline:** "Pharma: Reliable Measurement in Regulated Environments"
- **Text:** "A global pharmaceutical company deployed FALKENBERG capacitive sensors for fill-level monitoring on their vial filling lines. The cleanroom-compatible sensors with FDA 21 CFR Part 11 data integrity ensure every single vial is filled to specification. Automated calibration verification runs every 4 hours, with all results logged for regulatory audit trails."
- **Image:** Cleanroom pharmaceutical production line with sensor instrumentation
- **Button:** "Explore Pharma Solutions"

#### 6. Testimonials

- **2 testimonials:**
  1. **Klaus Richter**, VP Manufacturing, European Automotive OEM — "Implementing FALKENBERG's inline measurement system was the single biggest quality improvement in our body shop in the last decade. The ROI was achieved in under 8 months."
  2. **Dr. Yuki Tanaka**, Quality Director, Aerospace Manufacturer — "FALKENBERG's combination of sensor precision and IoT connectivity gives us the real-time quality data we need for our zero-defect manufacturing strategy."

#### 7. CTA

- **Headline:** "Let's Solve Your Measurement Challenge"
- **Text:** "Every manufacturing process is unique. Our application engineers combine deep industry knowledge with 40+ years of sensor expertise to design the optimal solution for your specific requirements."
- **Buttons:** "Schedule a Consultation" (primary, → /industry/contact), "View All Products" (secondary, → /industry/products)

---

### Page 4: About Us

**Slug:** `industry/about`
**Intent:** "Company about page for a family-owned German Mittelstand manufacturer. Tell the 40-year story from workshop to global player, introduce the leadership, showcase facilities, and reinforce the company's values of precision, reliability, and innovation."

**Section Sequence:**

| #   | Component      | Section Role              |
| --- | -------------- | ------------------------- |
| 1   | `hero`         | Company story opener      |
| 2   | `split`        | Company history & mission |
| 3   | `features`     | Core values               |
| 4   | `stats`        | Company facts             |
| 5   | `split`        | Leadership / R&D focus    |
| 6   | `testimonials` | Employee perspectives     |
| 7   | `cta`          | Careers / Contact         |

**Section Content Briefs:**

#### 1. Hero

- **Headline:** "Engineering Precision Since 1983"
- **Sub-headline:** "From a small workshop in Stuttgart to a global leader in industrial measurement technology — driven by a relentless pursuit of accuracy and a commitment to our customers' success."
- **Image:** Aerial or wide-angle shot of the FALKENBERG headquarters campus in Stuttgart
- **Buttons:** "Our History" (primary), "Join Our Team" (secondary)

#### 2. Split — Company History & Mission

- **Headline:** "From Workshop to World Stage"
- **Text:** "In 1983, mechanical engineer Klaus Falkenberg left his position at a major sensor company with a vision: to build the most accurate industrial sensors in the world. Working from a converted garage in Stuttgart-Vaihingen, he developed the FP-100 — an inductive displacement sensor that achieved 10x better accuracy than the competition. Word spread quickly through Germany's automotive industry, and by 1990, FALKENBERG sensors were standard equipment in quality labs across the country. Today, under the leadership of Dr. Lena Falkenberg, the company has grown to 420 employees, two production sites, and customers in over 30 countries — while preserving the founder's obsession with precision."
- **Image:** Split image: historic workshop photo (1983) alongside modern production facility

#### 3. Features — Core Values

- **Section headline:** "What Drives Us"
- **4 Feature items:**
  1. **Precision** — "Accuracy is not a feature — it's our foundation. Every product we make pushes the limits of what's measurable." — Icon: `star`
  2. **Reliability** — "Our sensors run 24/7 in the world's most demanding environments. They have to work, every single time." — Icon: `file`
  3. **Innovation** — "12% of revenue invested in R&D, every year. Over 180 patents. New products driven by real customer needs." — Icon: `search`
  4. **Partnership** — "We don't just sell sensors. We solve measurement problems — together with our customers, for the long term." — Icon: `person`

#### 4. Stats — Company in Numbers

- **4 Stat items:**
  1. "420" — "Employees Worldwide"
  2. "12%" — "Revenue Invested in R&D"
  3. "180+" — "Active Patents"
  4. "€78M" — "Annual Revenue (2025)"

#### 5. Split — Leadership & R&D

- **Headline:** "Led by Engineering, Driven by Innovation"
- **Text:** "Dr. Lena Falkenberg, CEO since 2015, holds a PhD in Optical Engineering from KIT (Karlsruhe Institute of Technology). Under her leadership, FALKENBERG has doubled its R&D investment, launched the FalkenConnect IoT platform, and expanded into confocal chromatic sensor technology — opening entirely new application fields in aerospace and medical device manufacturing. With 85 engineers in the R&D department and a state-of-the-art application laboratory, we develop tomorrow's measurement solutions in close collaboration with our customers and leading research institutions."
- **Image:** Modern R&D lab with engineers working on sensor prototypes

#### 6. Testimonials — Employee Perspectives

- **2 testimonials:**
  1. **Michael Braun**, Senior Sensor Engineer (18 years at FALKENBERG) — "What keeps me here is the combination of cutting-edge technology with a family atmosphere. We work on real engineering challenges that make a difference in factories around the world."
  2. **Dr. Aisha Patel**, Head of IoT Development (5 years at FALKENBERG) — "When I joined from a large tech company, I was amazed by the depth of domain expertise. At FALKENBERG, every software feature starts with understanding the physics of measurement."

#### 7. CTA

- **Headline:** "Write the Next Chapter With Us"
- **Text:** "We're always looking for talented engineers, scientists, and business professionals who share our passion for precision."
- **Buttons:** "View Open Positions" (primary), "Contact Us" (secondary, → /industry/contact)

---

### Page 5: Service & Support

**Slug:** `industry/service`
**Intent:** "Service and support page for a precision measurement company. Showcase calibration services, technical support, training programs, and spare parts availability. Address the full lifecycle of measurement equipment and build confidence in long-term partnership."

**Section Sequence:**

| #   | Component  | Section Role              |
| --- | ---------- | ------------------------- |
| 1   | `hero`     | Service page opener       |
| 2   | `features` | Service portfolio         |
| 3   | `split`    | Calibration lab spotlight |
| 4   | `split`    | Training programs         |
| 5   | `faq`      | Service questions         |
| 6   | `cta`      | Service request           |

**Section Content Briefs:**

#### 1. Hero

- **Headline:** "Supporting Your Precision — For the Entire Product Lifecycle"
- **Sub-headline:** "From installation and commissioning to calibration, training, and spare parts — FALKENBERG Service keeps your measurement systems running at peak performance."
- **Image:** Service engineer performing on-site calibration of a measurement system
- **Buttons:** "Request Service" (primary, → /industry/contact)

#### 2. Features — Service Portfolio

- **Section headline:** "Our Service Offerings"
- **4 Feature items:**
  1. **Calibration Services** — "ISO 17025-accredited laboratory. DAkkS-traceable calibration of all sensor types. Express service available." — Icon: `star`
  2. **Technical Support** — "Direct access to our application engineers. Phone, email, and remote diagnostics. Response within 4 hours." — Icon: `phone`
  3. **Training & Education** — "On-site and virtual training courses for sensor technology, measurement strategy, and FalkenConnect IoT setup." — Icon: `person`
  4. **Spare Parts & Repair** — "Genuine spare parts available for 15+ years. Factory repair with performance guarantee." — Icon: `download`

#### 3. Split — Calibration Lab

- **Headline:** "ISO 17025 Calibration Laboratory"
- **Text:** "Our state-of-the-art calibration laboratory in Stuttgart is accredited by DAkkS (Deutsche Akkreditierungsstelle) to ISO/IEC 17025. We calibrate all major sensor types — inductive, capacitive, optical, and confocal — against national and international reference standards. Standard turnaround is 5 business days, with express service (24–48 hours) available for critical needs. Every calibration includes a comprehensive certificate with measurement uncertainty statements."
- **Image:** Interior of a clean, temperature-controlled calibration laboratory with reference equipment
- **Button:** "Request Calibration" → /industry/contact

#### 4. Split — Training Programs

- **Headline:** "Training That Empowers Your Team"
- **Text:** "Our training programs are designed for measurement technicians, quality engineers, and production managers. Choose from standardized courses — 'Fundamentals of Industrial Sensing', 'Advanced Measurement Strategy', 'FalkenConnect IoT Administration' — or request a customized program tailored to your specific equipment and applications. All courses combine theory with hands-on practice using real sensor equipment, and are available on-site at your facility or at our Stuttgart training center."
- **Image:** Classroom/workshop setting with participants and sensor equipment
- **Button:** "Browse Training Courses"

#### 5. FAQ — Service Questions

- **6 Questions:**
  1. "How do I request a calibration?" — "Contact our service team via phone, email, or the online form. We'll provide a quote and shipping instructions. For large sensor quantities, we offer on-site calibration at your facility."
  2. "What is your calibration turnaround time?" — "Standard turnaround is 5 business days from receipt. Express service (24–48 hours) is available for an additional fee. We also offer scheduled annual calibration contracts with guaranteed turnaround."
  3. "Do you calibrate third-party sensors?" — "Yes, we calibrate sensors from all major manufacturers. Our accredited lab can calibrate any inductive, capacitive, or optical displacement sensor regardless of brand."
  4. "Is remote technical support available?" — "Yes. Our application engineers provide support via phone, email, and secure video link. For complex issues, we can remotely access your FalkenConnect gateway (with your permission) to diagnose problems in real time."
  5. "Can training be customized for our specific setup?" — "Absolutely. We regularly develop tailored training programs based on your specific sensor types, applications, and skill levels. Contact us with your requirements for a custom training proposal."
  6. "How long are spare parts available?" — "We guarantee spare part availability for a minimum of 15 years from product launch. Many legacy products are supported even longer. This is our commitment to your investment protection."

#### 6. CTA

- **Headline:** "Keep Your Measurement Systems at Peak Performance"
- **Text:** "Contact our service team to schedule a calibration, book a training session, or discuss a long-term support contract."
- **Buttons:** "Contact Service Team" (primary, → /industry/contact), "Download Service Brochure" (secondary)

---

### Page 6: Contact

**Slug:** `industry/contact`
**Intent:** "Contact page for a German industrial manufacturer. Provide clear contact options (form, phone, email), list office locations, and make it easy for potential customers and existing clients to reach the right department."

**Section Sequence:**

| #   | Component  | Section Role          |
| --- | ---------- | --------------------- |
| 1   | `hero`     | Contact page opener   |
| 2   | `features` | Contact channels      |
| 3   | `contact`  | Contact details       |
| 4   | `faq`      | Pre-contact questions |
| 5   | `cta`      | Final prompt          |

**Section Content Briefs:**

#### 1. Hero

- **Headline:** "Get in Touch"
- **Sub-headline:** "Whether you need a product recommendation, a quote, or technical support — we're here to help. Reach out to the right team directly."
- **Image:** Friendly, professional image of the FALKENBERG reception area or customer meeting room
- **Buttons:** "Call Us Now" (primary), "Send Email" (secondary)

#### 2. Features — Contact Channels

- **Section headline:** "How to Reach Us"
- **4 Feature items:**
  1. **Sales & Quotations** — "Get product recommendations and competitive quotes from our sales engineering team." — Icon: `email`
  2. **Technical Support** — "Speak directly with our application engineers for installation, integration, or troubleshooting help." — Icon: `phone`
  3. **Calibration & Service** — "Schedule calibrations, request repairs, or order spare parts." — Icon: `star`
  4. **Visit Our Showroom** — "Experience our sensors and measurement systems hands-on at our Stuttgart headquarters." — Icon: `map-pin`

#### 3. Contact — Company Details

- **Company name:** FALKENBERG Precision GmbH
- **Address:** Industriestraße 42, 70565 Stuttgart-Vaihingen, Germany
- **Phone:** +49 711 555-0
- **Email:** info@falkenberg-precision.de
- **Map:** Stuttgart office location

#### 4. FAQ — Pre-Contact Questions

- **5 Questions:**
  1. "What information should I prepare before contacting sales?" — "To provide the fastest and most accurate recommendation, please have the following ready: your measurement target material, measurement range, required accuracy, environmental conditions (temperature, contamination), and any integration requirements (interface type, PLC brand)."
  2. "Can I get a product demo before purchasing?" — "Yes. We offer free on-site demos, virtual demos via video conference, and hands-on sessions at our Stuttgart showroom. Contact sales to schedule."
  3. "Do you have local sales representatives?" — "Yes. FALKENBERG has direct sales offices in Stuttgart, Munich, and Hamburg, plus authorized representatives and distribution partners in over 30 countries. Contact us to find your nearest representative."
  4. "What are your business hours?" — "Our offices are open Monday–Friday, 8:00–17:00 CET. Technical support is available Monday–Friday 7:00–18:00 CET, with emergency support available 24/7 for customers with active support contracts."
  5. "Can I visit your production facility?" — "We welcome facility tours for qualified business inquiries. Tours include our production floor, R&D lab, and calibration laboratory. Please schedule at least 2 weeks in advance via our sales team."

#### 5. CTA

- **Headline:** "Let's Start a Conversation"
- **Text:** "Our team typically responds within one business day. For urgent technical matters, please call our support hotline directly."
- **Buttons:** "Send a Message" (primary), "Call +49 711 555-0" (secondary)

---

## Content Generation Workflow

Follow the workflow documented in [docs/skills/plan-page-structure.md](skills/plan-page-structure.md):

### For Each Page

1. **`analyze_content_patterns`** — Already done (results cached). Skip unless new content has been published since.

2. **`plan_page(intent: "<page intent from above>")`** — Let the AI confirm/adjust the planned section sequence. Compare with the manual plan above and reconcile if needed.

3. **`generate_section`** for each section — Use the content briefs above as the `prompt` parameter. Set `previousSection` and `nextSection` for transition context.

4. **`create_page_with_content`** — Combine all generated sections:

   ```
   create_page_with_content(
     name: "<Page Name>",
     slug: "<slug>",
     path: "industry",  // or "industry/{subpage}"
     sections: [...all generated sections...],
     uploadAssets: true,
     assetFolderName: "FALKENBERG Precision",
     publish: false
   )
   ```

5. **Review** in Storyblok Visual Editor and publish when ready.

### Recommended Page Creation Order

1. Homepage (establishes the brand voice)
2. About Us (deepens the company narrative)
3. Products (core product information)
4. Solutions (application stories reference products)
5. Service & Support (references products and solutions)
6. Contact (conversion endpoint for all other pages)

---

## Notes for Content Creators

- **Tone of voice:** Professional, technical but accessible. Think "confident German engineering firm speaking to technical decision-makers." Avoid jargon overload — the content should be understandable by both engineers and C-level executives.
- **Image style:** Clean, modern industrial photography. Well-lit production facilities, precision equipment in focus, professional people at work. Avoid stock-photo clichés of handshakes and generic office settings.
- **All content is fictional.** FALKENBERG Precision GmbH does not exist. The company, products, people, testimonials, and statistics described in this document are entirely made up for demonstration purposes.
- **Language:** All content in English.
