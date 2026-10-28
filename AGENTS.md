<!-- LOVABLE:BEGIN -->
> [!IMPORTANT]
> This project is connected to [Lovable](https://lovable.dev). Avoid rewriting
> published git history — force pushing, or rebasing/amending/squashing commits
> that are already pushed — as it rewrites history on Lovable's side and the
> user will likely lose their project history.
>
> Commits you push to the connected branch sync back to Lovable and show up in
> the editor, so keep the branch in a working state.
<!-- LOVABLE:END -->

## Architecture rules
- Orders are created only via the `place_order` database function; it recomputes prices, shipping and stock server-side, so never trust client totals.
- Store content (prices, sizes, shipping fees, contact info, banner, policies) lives in the database and is edited from /admin; never hardcode business values in components.
- Text starting with `[مؤقت]` is a placeholder and is hidden from shoppers (`isPlaceholder` in src/lib/store.ts).
- Admin access is the `admin` role in `user_roles`; public signup is disabled and admin provisioning uses the authentication provider's server-only admin API, never a signup trigger.
- UI strings use `t(ar, en)` from src/lib/i18n.tsx; Arabic RTL is the default.
- Store media uploads use a private, admin-write bucket; the public image handler serves only validated image paths from that bucket, never arbitrary storage files.
- Inventory auditing and cancellation restoration run in database triggers; cancellation is terminal and stock restoration happens at most once in the same transaction.
- Coupons are evaluated through `quote_order` and redeemed under row locks in `place_order`; storefront estimates never authorize a discount.
- Public metadata reads use a publishable server client with anonymous RLS; no admin client is used for normal store reads.
- A variant owns fragrance, size, SKU, images, price and stock; cart identity remains its UUID, and order-item triggers snapshot fragrance and SKU so later catalog changes cannot rewrite order details.
