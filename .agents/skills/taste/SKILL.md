---
name: taste
description: High-end UI/UX design standards, aesthetic taste guidelines, color systems, typography, and visual polish for the Nohitatu website and web applications.
---

# Nohitatu Design & Aesthetic Taste Guide

This skill governs visual excellence, UI/UX aesthetics, color harmony, typography, and interactive polish across the Nohitatu Web Platform.

## 1. Visual Philosophy & Core Pillars
- **Wow Factor First Impression**: Every page, modal, widget, and card must look premium, modern, and polished. Avoid minimum viable product (MVP) aesthetics or default browser styling.
- **Glassmorphism & Depth**: Use multi-layered backdrop blurs (`backdrop-filter: blur(12px)`), soft ambient glow shadows (`0 8px 30px rgba(114, 108, 244, 0.15)`), and delicate borders (`1px solid rgba(255, 255, 255, 0.15)`).
- **Dynamic Micro-Interactions**: Interactive elements must feel alive with hover scaling (`transform: translateY(-3px)`), active state feedback (`scale(0.97)`), and smooth transitions (`transition: all 0.25s cubic-bezier(0.16, 1, 0.3, 1)`).

## 2. Color Palette & Token System
- **Primary Brand Accent**: `#726cf4` (Electric Violet / Indigo)
- **Secondary Accent**: `#00f2fe` (Cyan Spark) / `#6366f1` (Deep Indigo)
- **Neutral Dark (Text & Headers)**: `#0f172a` (Slate 900)
- **Neutral Muted**: `#64748b` (Slate 500) / `#475569` (Slate 600)
- **Light Surfaces / Cards**: `#ffffff` / `#f8fafc` (Slate 50)
- **Borders & Dividers**: `#e2e8f0` (Slate 200) / `#f1f5f9` (Slate 100)
- **Status Indicators**:
  - Success / Active: `#16a34a` / `#22c55e`
  - Warning: `#f59e0b`
  - Danger: `#ef4444`

## 3. Typography Hierarchy
- **Primary Body & UI Font**: `'Plus Jakarta Sans', system-ui, sans-serif` (Weights: 400, 500, 600, 700, 800)
- **Editorial Heading Font**: `'Playfair Display', Georgia, serif` (For featured hero quotes and section titles)
- **Code / Badges**: `'Fira Code', 'JetBrains Mono', monospace`
- **Heading Line Heights**: Strict `line-height: 1.15` to `1.25` for tight, elegant hero typography.
- **Letter Spacing**: `-0.02em` for bold headings; `+0.04em` for uppercase badge labels.

## 4. UI Component Taste Rules

### A. Buttons & CTAs
- Pill rounded edges (`border-radius: 12px` or `24px`).
- Gradient backgrounds with subtle drop shadows (`box-shadow: 0 4px 14px rgba(114, 108, 244, 0.3)`).
- Clear arrow indicators (`→` or SVG icons) with `margin-left` micro-shifts on hover.

### B. Cards & Portfolio Items
- Border radius: `16px` to `20px`.
- High-definition media preview images with overflow hidden and smooth zoom on hover (`transform: scale(1.04)`).
- Crisp tag pills (`.tech-tag`) with soft violet or slate tinted backgrounds (`background: #f1f5f9; color: #475569`).

### C. Floating Widgets (Chatbot & Modals)
- Smooth floating position (`bottom: 24px; right: 24px; z-index: 9999`).
- Crisp avatar badges with vibrant gradients and animated status dots (`.status-dot`).
- High-contrast text readability (never dark grey on dark backgrounds or white on light grey).

## 5. Quality Checklist Before Publishing
- [ ] No raw unstyled default browser controls or plain blue links.
- [ ] No broken placeholder images; use real asset paths or clean SVGs.
- [ ] All interactive buttons have `:hover`, `:focus-visible`, and `:active` pseudo-states.
- [ ] Cross-browser font and emoji compatibility (use fallback icons where emojis vary).
- [ ] Fast, smooth 60fps CSS transitions without layout shifts.
