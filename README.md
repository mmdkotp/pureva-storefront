# PUREVA Storefront

Role: You are a senior e-commerce web designer, brand strategist, and full-stack developer specializing in premium household cleaning products.

Project: Build a complete, professional, mobile-first e-commerce website for PUREVA (بيوريفا), an Egyptian brand specializing in liquid dishwashing soap.

1. Brand Identity

Brand name: PUREVA

Arabic brand name: بيوريفا

Product: Liquid dishwashing soap.

Brand personality: Premium, minimalist, trustworthy, modern, and clean.

Primary colors: Matte black, charcoal, metallic silver, and white.

Visual style: Elegant typography, generous whitespace, refined lines, subtle shine accents, and a premium packaging-inspired aesthetic.

Logo direction: A distinctive PUREVA wordmark with custom lettering, accompanied by بيوريفا in Arabic. Avoid generic water-drop and leaf symbols, excessive gradients, and exaggerated 3D effects.

Tagline: “نضافة تفرق، ولمعة تدوم” (Cleanliness that makes a difference, shine that lasts).

2. Website Design

Create a polished storefront that feels like an established Egyptian consumer brand, not a generic website template.

Fully responsive design for mobile, tablet, and desktop.

Arabic RTL as the default language, with optional English support.

Egyptian currency (EGP) for all prices.

Premium black-and-white layout with restrained silver accents.

Clear typography and easy navigation.

Fast loading, accessible controls, and SEO-friendly structure.

3. Homepage

Include:

A premium hero section featuring the PUREVA logo and a high-quality product image.

A clear headline in Arabic introducing PUREVA dishwashing liquid.

A prominent “اطلب دلوقتي” (Order Now) button.

Product benefits presented only when verified, without inventing performance claims.

Product cards showing actual product sizes, prices, and available variants.

A “ليه تختار بيوريفا؟” section.

Customer reviews only when genuine reviews are available.

A dedicated wholesale and retailer inquiry section.

A footer with contact details, social media links, and policies.

4. Product Page

Create a dedicated product detail page with:

Product photography and gallery.

Product size, scent, ingredients, usage instructions, and price, using editable real product data.

Quantity selector and add-to-cart button.

Shipping and payment information.

Frequently asked questions.

A WhatsApp inquiry option.

Do not invent product specifications, certifications, ingredients, customer ratings, or cleaning-performance claims.

5. Shopping Cart and Checkout

Implement:

Functional shopping cart.

Quantity adjustment and item removal.

Automatic subtotal calculation.

Shipping fee calculation based on configurable rules.

Checkout form with customer name, Egyptian phone number, city, and full address.

Order confirmation page.

Configurable cash-on-delivery support.

Payment integration only when real credentials and a supported payment provider are configured.

6. Wholesale and Retailer Page

Create a separate page for shops, distributors, and bulk buyers, including:

Wholesale inquiry form.

Business name and contact information fields.

Requested quantities.

Contact via WhatsApp.

Wholesale prices shown only after they are configured.

7. Admin Dashboard

Provide a secure admin area to manage:

Products, sizes, prices, and stock.

Orders and order statuses.

Shipping fees and service areas.

Homepage banners and product images.

Customer inquiries.

Wholesale requests.

Use a real database and secure authentication if supported by the chosen stack. Never expose secret API keys or administrative credentials in frontend code.

8. Technical Requirements

Use a modern, maintainable frontend framework.

Use reusable components and clean project structure.

Connect the storefront to a real backend or database when available.

Validate forms and display helpful Arabic error messages.

Include loading, empty, success, and failure states.

Optimize images and performance.

Do not create fake checkout success messages or pretend that orders were submitted when no backend exists.

9. Important Business Rules

This is a new Egyptian brand with a limited initial budget. Build the website so it can launch with one product and expand later.

Use clearly labeled placeholders for unknown prices, product sizes, delivery fees, contact details, and social links. Make these values easy to update without rebuilding the entire website.

Final goal: Deliver a polished, functional e-commerce website for PUREVA (بيوريفا) that communicates premium quality, supports direct online orders, and can later grow into a broader household-cleaning product brand.

This project was built with [Lovable](https://lovable.dev).

## Build with Lovable

Continue developing this project in the [Lovable editor](https://lovable.dev/projects/f90873b6-2834-4111-8b94-7fa4a2c8d84d).

- **Ship faster**: describe what you want to build and Lovable handles the code.
- **Stay in sync**: every change made in Lovable is committed straight to this repository.
- **Full ownership**: this code is yours. Push to `main` on GitHub and your changes sync back into Lovable, ready for your next prompt.

## Development

Prefer working locally? You need Node.js and npm — [install with nvm](https://github.com/nvm-sh/nvm#installing-and-updating).

```sh
git clone <this-repository-url>
cd <repository-name>
npm i
npm run dev
```
