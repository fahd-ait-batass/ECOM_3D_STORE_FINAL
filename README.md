# ECOM 3D STORE

A full-stack premium 3D luxury e-commerce project built with React + Vite on the frontend and Django REST Framework on the backend.

## Stack

- Frontend: React, Vite, React Router, Framer Motion, Recharts, Context API, CSS
- Backend: Django, Django REST Framework, DRF Token Authentication, SQLite for development
- UI: bold neon 3D tech/gaming theme, hot pink/magenta and purple glow accents, glassmorphism, animated 3D product cards, mobile bottom navigation

## Project Structure

```text
ECOM_3D_STORE/
  backend/
    accounts/
    ecom3d/
    orders/
    store/
    media/
  frontend/
    public/
    src/
```

## Quick Local Run

From the project root on Windows, run:

```powershell
.\START_ALL.bat
```

This opens separate backend and frontend terminals.

- Frontend: `http://127.0.0.1:5173/`
- Backend API: `http://127.0.0.1:8000/api/`
- Django admin: `http://127.0.0.1:8000/admin/`

You can also run each side separately:

```powershell
.\START_BACKEND.bat
.\START_FRONTEND.bat
```

## Final Project Summary

ECOM 3D STORE is ready as a presentation-grade full-stack luxury ecommerce demo. It includes a responsive dark 3D storefront, product browsing and filtering, persistent customer wishlists, safe stock-aware cart and checkout flows, customer authentication, account profile management, customer order history, verified-purchase product reviews, staff-protected React admin dashboard with sales analytics, editable store settings, professional information pages, SEO metadata, robots/sitemap files, and Windows one-click run scripts.

Frontend theme updated to bold neon 3D tech/gaming ecommerce style.

Completed highlights:

- Premium React/Vite storefront with glassmorphism, neon accents, animated hero, product cards, mobile bottom navigation, mini cart drawer, loading and empty states.
- Shop page with search, category filter, sorting, and price filtering.
- Django REST Framework backend with products, categories, orders, order items, authentication, media uploads, store settings, pagination, search, and filtering.
- Customer auth pages for login, registration, account profile updates, logout, and protected account access.
- Persistent authenticated customer wishlist with real backend storage, navbar count, `/wishlist` page, and synchronized heart buttons.
- Stock-aware storefront and checkout with product low-stock thresholds, calculated stock status, safe order validation, and admin stock alerts.
- Customer order history and visual tracking timelines at `/account` through `GET /api/orders/my/`.
- Secure promo-code validation and backend-calculated checkout discounts.
- Verified-purchase product reviews with approval moderation, public review summaries, calculated average ratings, and review-count display.
- Staff-only React admin dashboard for product CRUD, order management, tracking numbers, coupon CRUD, low-stock visibility, product active/featured toggles, and store settings updates.
- Admin dashboard analytics with date ranges, KPI cards, revenue/orders charts, status distribution, top-selling products, recent orders, stock alerts, and coupon usage.
- Best-effort email notifications for order confirmations, admin new-order alerts, and customer status/tracking updates.
- Store settings used dynamically in footer, checkout, contact, delivery, returns, and WhatsApp order messages.
- Professional pages: `/about`, `/contact`, `/delivery`, `/returns`.
- SEO support with page meta tags, Open Graph/Twitter tags, JSON-LD, `robots.txt`, and `sitemap.xml`.

## Final Screenshots

Final presentation screenshots are stored in:

```text
PROJECT_SCREENSHOTS/
```

Included screenshots:

- `01_homepage_desktop.png`
- `02_shop_desktop.png`
- `03_product_details_desktop.png`
- `04_cart_desktop.png`
- `05_checkout_desktop.png`
- `06_login_desktop.png`
- `07_account_desktop.png`
- `08_admin_dashboard_desktop.png`
- `09_contact_desktop.png`
- `10_mobile_homepage.png`
- `11_mobile_shop.png`
- `12_mobile_checkout.png`

## Admin Account Notes

Create a staff/admin user when setting up a fresh database:

```bash
cd backend
python manage.py createsuperuser
```

Only users with `is_staff` or `is_superuser` can access protected admin API writes and the `/admin-dashboard` frontend route.

## Backend Setup

```bash
cd ECOM_3D_STORE/backend
python -m venv .venv
.venv\Scripts\activate
pip install -r requirements.txt
python manage.py migrate
python manage.py seed_demo
python manage.py createsuperuser
python manage.py runserver
```

Backend URL: `http://127.0.0.1:8000/`

Django admin: `http://127.0.0.1:8000/admin/`

## Frontend Setup

```bash
cd ECOM_3D_STORE/frontend
npm install
npm run dev
```

Frontend URL: `http://localhost:5173/`

## Environment Setup

Backend environment values live in `backend/.env` for local development. Use `backend/.env.example` as the template:

```text
SECRET_KEY=change-this-production-secret
DEBUG=True
ALLOWED_HOSTS=localhost,127.0.0.1
CORS_ALLOWED_ORIGINS=http://localhost:5173,http://127.0.0.1:5173
EMAIL_BACKEND=django.core.mail.backends.console.EmailBackend
EMAIL_HOST=localhost
EMAIL_PORT=25
EMAIL_USE_TLS=False
EMAIL_HOST_USER=
EMAIL_HOST_PASSWORD=
EMAIL_TIMEOUT=10
DEFAULT_FROM_EMAIL=ECOM 3D STORE <no-reply@ecom3d.local>
```

The backend still has safe development defaults so local SQLite development works even before editing `.env`.
The default email backend prints messages in the Django console during local development, so no SMTP credentials are needed for testing.

Frontend environment values live in `frontend/.env`. Use `frontend/.env.example` as the template:

```text
VITE_API_BASE_URL=http://127.0.0.1:8000/api
VITE_SITE_URL=http://localhost:5173
```

`VITE_API_BASE_URL` controls all React API calls. `VITE_SITE_URL` is used as a deployment fallback for SEO canonical/Open Graph URLs.

## Step 1 - Backend Authentication

Added DRF token authentication with an `accounts` app and a `UserProfile` model for customer profile fields:

- `phone`
- `city`
- `address`

Auth tokens are returned by register/login and should be sent as:

```text
Authorization: Token <token>
```

## Step 2 - Frontend Authentication UI

Added React authentication UI using the existing Django token endpoints:

- `AuthContext` manages login, register, logout, current user hydration, token storage, and profile updates.
- `/login` provides a premium dark glassmorphism login form for username/email and password.
- `/register` provides a premium registration form for username, email, password, first name, last name, phone, city, and address.
- `/account` is protected on the frontend and redirects guests to `/login`.
- The account page shows the signed-in user, profile fields, a profile update form, and a logout button.
- The navbar shows Login/Register for guests and Account/Logout for authenticated users.

The frontend stores the token in `localStorage` under:

```text
ecom_3d_auth_token
```

## Step 3 - Protect Admin Dashboard

The React `/admin-dashboard` route is protected with an admin-only route guard:

- Guests are redirected to `/login`.
- Logged-in non-staff customers see a premium `Access denied` state.
- Staff/admin users can access the dashboard.
- The navbar only shows the Admin link when `/api/auth/me/` reports `is_staff` or `is_superuser`.
- Admin dashboard API requests include the stored auth token through the shared API client.

The backend `/api/auth/me/` response includes:

```text
username, email, first_name, last_name, phone, city, address, is_staff, is_superuser
```

Create an admin user when needed:

```bash
python manage.py createsuperuser
```

## Step 4 - Customer Order History

Customer orders are linked to authenticated users while guest checkout remains supported:

- `Order.user` is optional, so guest orders can still be created.
- When a logged-in customer places an order, the backend attaches `request.user`.
- `GET /api/orders/my/` returns only the authenticated customer's orders.
- The account page shows profile details, the profile update form, logout, and premium order-history cards.
- Order cards include order number, date, status, payment method, products, quantities, product images, and total price.
- Customers with no orders see a `No orders yet` state with a button to `/shop`.

## New Feature 1 - Order Tracking

Added clear customer order tracking while keeping guest checkout and customer order isolation intact:

- Order statuses now support `pending`, `confirmed`, `processing`, `shipped`, `delivered`, and `cancelled`.
- `Order` now stores `tracking_number` and `updated_at`.
- Order serializers include `tracking_number`, `status`, `created_at`, and `updated_at`.
- Staff/admin users can update both status and tracking number through the existing order status endpoint.
- Normal customers can only fetch their own orders through `GET /api/orders/my/`.
- The account page displays a premium tracking timeline for each order: Order placed, Confirmed, Processing, Shipped, Delivered.
- Cancelled orders show a clear cancelled tracking state.
- Tracking numbers appear on customer order cards when assigned.
- The admin dashboard order table includes status, tracking number input, Save feedback, and tracking details in the order modal.

## New Feature 2 - Coupons / Promo Codes

Added secure coupon support with all discount calculations validated by Django:

- `Coupon` model supports percentage and fixed discounts.
- Coupon fields include code, discount value, minimum order amount, optional maximum discount amount, optional usage limit, used count, active state, validity dates, and created date.
- Coupon codes are normalized to uppercase and validated case-insensitively.
- Django admin includes coupon management.
- `POST /api/coupons/validate/` publicly validates a promo code for a provided subtotal and returns the discount preview.
- Order creation accepts optional `coupon_code`, validates it again on the backend, saves `coupon_code` and `discount_amount`, and increments `used_count` only after the order is created.
- Orders now store backend-calculated `subtotal`, `discount_amount`, `delivery_price`, and `total_price`.
- Frontend checkout includes a premium promo-code panel with Apply/Remove controls, success/error messages, discount row, delivery row, and final total.
- The frontend sends only the promo code during checkout; it does not send trusted discount totals.
- The admin dashboard includes a Coupons section for create, edit, activate/deactivate, delete, usage count, usage limit, validity, and discount configuration.
- Guests and normal users cannot access coupon CRUD endpoints.

## New Feature 3 - Product Reviews & Ratings

Added verified-purchase reviews and calculated ratings while keeping moderation in staff/admin hands:

- `Review` model stores product, user, rating from 1 to 5, optional title, comment, approval state, created date, and updated date.
- Each customer can submit only one review per product.
- Only authenticated users can create reviews.
- A customer can review a product only after purchasing it in a delivered order.
- Public review endpoints return only approved reviews.
- User review edit/delete endpoints are limited to the review owner.
- Staff/admin review endpoints can list all reviews, approve/unapprove reviews, and delete reviews.
- Product serializers include `average_rating` and `review_count` calculated from approved reviews.
- The existing product `rating` field remains as a fallback when a product has no approved reviews.
- Product cards and product details display the calculated rating and review count when available.
- Product details include a premium Reviews section with average rating, 5-star breakdown, approved review cards, verified purchase badges, empty state, and authenticated review form.
- Review edits reset approval so staff/admin can moderate changed content.
- The admin dashboard includes a Reviews section with approved/pending filtering, approve/unapprove actions, and delete actions.

## New Feature 4 - Persistent Customer Wishlist

Replaced visual-only heart behavior with a real authenticated customer wishlist:

- `WishlistItem` stores user, product, and created date.
- Each user can save the same product only once.
- Wishlist items are isolated by authenticated user.
- Guests receive `401` from wishlist API endpoints.
- Hard-deleting a product safely removes related wishlist items through cascade deletion.
- Django admin includes wishlist item management.
- `GET /api/wishlist/` returns the logged-in user's saved products.
- `POST /api/wishlist/` saves a product by `product_id`.
- `DELETE /api/wishlist/<product_id>/` removes a product from the logged-in user's wishlist.
- Wishlist API responses include product details needed by React: id, name, slug, image, price, old price, stock, calculated average rating, and review count.
- React `WishlistContext` loads wishlist data after login, clears it after logout, and keeps add/remove state synchronized.
- Product cards and product details hearts now use the real API and show filled/empty state from account data.
- Guests clicking wishlist hearts are sent to `/login`.
- `/wishlist` is a protected premium grid page with saved products, add-to-cart, remove, stock status, rating, and details links.
- The navbar shows a wishlist heart/count for logged-in users.
- `/account` includes a compact wishlist summary link.

## New Feature 5 - Stock Alerts & Safe Stock Management

Added stock-aware customer UX and safer backend stock handling:

- `Product.low_stock_threshold` controls when a product becomes low stock.
- Products expose calculated `stock_status`: `in_stock`, `low_stock`, or `out_of_stock`.
- Product serializers include `low_stock_threshold` and `stock_status`.
- Staff/admin product CRUD can update both `stock` and `low_stock_threshold`.
- Order creation now aggregates requested quantities per product before saving.
- Orders are rejected when a product is inactive, out of stock, missing, or requested above available stock.
- Stock is decremented only after a valid order is created inside the transaction.
- Stock never goes negative from checkout validation.
- Product cards, product details, wishlist, cart, mini cart, and checkout show clear stock labels.
- Add-to-cart is disabled for out-of-stock products.
- Cart and mini cart quantity controls cannot increase beyond the known stock limit.
- Checkout shows readable stock errors if availability changes before the order is submitted.
- Admin dashboard includes stock overview cards for out-of-stock products, low-stock products, and total stock units.
- Admin dashboard includes a Stock Alerts section with product name, current stock status, threshold, and quick edit action.
- Staff-only endpoint `GET /api/admin-dashboard/stock-alerts/` returns stock alert counts and alert products.

## New Feature 6 - Admin Dashboard Analytics

Added protected sales and store analytics for staff/admin users:

- `GET /api/admin-dashboard/analytics/` is staff/admin only.
- Guests receive `401`; normal authenticated customers receive `403`.
- Optional filters are supported: `period=7d|30d|90d|12m`, `date_from`, and `date_to`.
- Revenue, average order value, coupon discounts, delivery revenue, and top-selling products exclude cancelled orders.
- Pending orders are included in revenue until they are cancelled.
- Analytics KPIs include revenue, orders, average order value, customers, status counts, products, low stock, out of stock, coupon discounts, and delivery revenue.
- Chart-ready API data includes revenue by day/month, orders by day/month, order status distribution, top products by quantity, top products by revenue, recent orders, low-stock products, and coupon usage.
- The React admin dashboard includes a premium Analytics section with Recharts visualizations.
- Admin dashboard charts include revenue trend, orders trend, status distribution, and top-selling products.
- Analytics UI includes period selector, loading skeletons, empty states, API error feedback, recent orders, low-stock table, and coupon usage table.

## New Feature 7 - Email Notifications

Added best-effort order email notifications without making checkout or admin updates depend on SMTP availability:

- Django email settings now read `EMAIL_BACKEND`, `EMAIL_HOST`, `EMAIL_PORT`, `EMAIL_USE_TLS`, `EMAIL_HOST_USER`, `EMAIL_HOST_PASSWORD`, `EMAIL_TIMEOUT`, and `DEFAULT_FROM_EMAIL` from environment variables.
- Local development defaults to `django.core.mail.backends.console.EmailBackend`, which prints emails in the backend terminal.
- `Order.email` is optional and backwards-compatible for old orders.
- Guest checkout can include an email address, but checkout still works without one.
- Logged-in checkout automatically uses the account email when the request does not provide an order email.
- Order creation sends a customer confirmation email when the order has a valid email address.
- Order creation sends an admin new-order notification to the dynamic `StoreSettings.email` address when it is valid.
- Staff/admin status updates send customer update emails when the status changes, or when a useful tracking number change is added.
- Re-saving the same status and tracking number does not send a duplicate update email.
- Email failures are caught and logged so they do not roll back successful orders or block admin status updates.
- Plain-text and HTML templates live in `backend/orders/templates/emails/`.
- Checkout includes an optional email field and note for order updates.
- Account order history and admin order details now show the order email when available.

Local console email testing:

```bash
cd backend
python manage.py runserver
```

Place an order with an email address and Django will print the generated email bodies in the backend terminal. For production SMTP, set the email environment variables listed above and keep credentials outside the repository.

## Step 5 - Store Settings

Added editable store settings for production-style contact and delivery configuration:

- `StoreSettings` is a singleton model registered in Django admin.
- `StoreSettings.load()` automatically creates the default settings row when none exists.
- Settings fields include store name, phone, WhatsApp, email, address, Instagram, Facebook, delivery price, free delivery threshold, and currency.
- `GET /api/store-settings/` is public.
- `PUT /api/store-settings/` is staff/admin only.
- Footer contact links use the live settings.
- Checkout uses `delivery_price`, `free_delivery_threshold`, `currency`, and the configured WhatsApp number.
- React uses `StoreSettingsContext` so footer, checkout, contact pages, cart totals, and admin settings stay in sync after an admin save.
- The admin dashboard includes a premium Store Settings form with success/error feedback.

## Step 6 - Professional Store Pages

Added polished store information pages with the existing dark luxury style:

- `/about` explains the premium catalog, checkout flow, and admin-managed store operations.
- `/contact` shows dynamic email, phone, WhatsApp, address, Instagram, and Facebook links from `StoreSettingsContext`.
- `/contact` includes a premium glassmorphism contact form for name, email, phone, and message with a local success state.
- `/delivery` explains confirmation, preparation, shipping, and delivery support using live delivery price, free delivery threshold, and currency.
- `/returns` explains return conditions, exchange process, damaged product handling, and support contact options.
- Footer links include About, Delivery, Returns, and Contact.
- Navbar includes Contact while keeping the mobile menu clean.

Current workspace run commands:

```powershell
cd C:\Users\asus\Desktop\codx\ECOM_3D_STORE\backend
C:\Users\asus\Desktop\codx\.venv\Scripts\python.exe manage.py runserver
```

```powershell
cd C:\Users\asus\Desktop\codx\ECOM_3D_STORE\frontend
npm run dev
```

## Step 7 - SEO, Meta Tags, Robots and Sitemap

Prepared the React frontend for better search metadata and sharing previews:

- `react-helmet-async` wraps the app through `HelmetProvider`.
- `Seo` now outputs page title, meta description, canonical URL, Open Graph tags, Twitter card tags, absolute social image URLs, and JSON-LD.
- Organization JSON-LD is included through the reusable SEO component.
- Product details pages use dynamic product title, description, product image, and Product JSON-LD schema.
- Page metadata is covered for Home, Shop, Product Details, Cart, Checkout, Login, Register, Account, About, Contact, Delivery, and Returns.
- `frontend/public/robots.txt` and `frontend/public/sitemap.xml` are included for development.

Before deploying, replace localhost URLs in:

- `frontend/public/robots.txt`
- `frontend/public/sitemap.xml`
- `VITE_SITE_URL` in the frontend deployment environment, if used for canonical/Open Graph fallbacks

## Step 8 - Production Preparation and Run Scripts

Prepared the project for cleaner local runs and deployment handoff:

- Backend settings now read `SECRET_KEY`, `DEBUG`, `ALLOWED_HOSTS`, and `CORS_ALLOWED_ORIGINS` from environment variables.
- Legacy `DJANGO_SECRET_KEY`, `DJANGO_DEBUG`, and `DJANGO_ALLOWED_HOSTS` still work as fallbacks.
- Frontend API calls use `VITE_API_BASE_URL`, with the previous `VITE_API_URL` kept as a fallback.
- Added `backend/.env.example` and `frontend/.env.example`.
- Added `START_BACKEND.bat`, `START_FRONTEND.bat`, and `START_ALL.bat` at the project root.
- Kept SQLite for local development.
- Static/media settings are documented in Django settings and below.

## Deployment Preparation Checklist

Backend hosting:

- Set `DEBUG=False`.
- Set a strong unique `SECRET_KEY`.
- Set `ALLOWED_HOSTS` to the backend domain, for example `api.example.com`.
- Set `CORS_ALLOWED_ORIGINS` to the deployed frontend origin, for example `https://example.com`.
- Run `python manage.py migrate --noinput`.
- Run `python manage.py collectstatic` and serve `backend/staticfiles/` through the host, CDN, or reverse proxy.
- Keep `MEDIA_ROOT` uploads durable. For real production, use persistent disk or object storage for product/category images.
- Configure production SMTP with `EMAIL_BACKEND=django.core.mail.backends.smtp.EmailBackend`, `EMAIL_HOST`, `EMAIL_PORT`, `EMAIL_USE_TLS`, `EMAIL_HOST_USER`, `EMAIL_HOST_PASSWORD`, `EMAIL_TIMEOUT`, and `DEFAULT_FROM_EMAIL`.
- Keep SMTP credentials in environment variables only, never in source control.
- SQLite is fine for local development. For production, plan PostgreSQL with a managed database and update `DATABASES` or add a `DATABASE_URL` parser before deploying.

Frontend hosting:

- Set `VITE_API_BASE_URL` to the deployed backend API URL.
- Set `VITE_SITE_URL` to the deployed frontend domain.
- Run `npm run build` and deploy `frontend/dist/`.
- Replace localhost URLs in `frontend/public/robots.txt` and `frontend/public/sitemap.xml`.
- Verify Open Graph previews after replacing the domain.

Media uploads:

- Development media is served by Django only when `DEBUG=True`.
- Product/category upload fields still use `MEDIA_URL=/media/` and `MEDIA_ROOT=backend/media`.
- In production, configure the host or storage service to serve uploaded media without relying on Django development static serving.

## API Endpoints

```text
POST /api/auth/register/
POST /api/auth/login/
POST /api/auth/logout/
GET  /api/auth/me/
PUT  /api/auth/profile/

GET  /api/categories/
GET  /api/products/
GET  /api/products/featured/
GET  /api/products/<slug>/
GET  /api/products/<slug>/reviews/
POST /api/products/<slug>/reviews/       authenticated verified buyer only
GET  /api/products/<slug>/review-summary/
GET  /api/reviews/<id>/                  owner only
PUT  /api/reviews/<id>/                  owner only
PATCH /api/reviews/<id>/                 owner only
DELETE /api/reviews/<id>/                owner only

GET  /api/wishlist/                      authenticated customer only
POST /api/wishlist/                      authenticated customer only
DELETE /api/wishlist/<product_id>/       authenticated customer only

GET  /api/store-settings/
PUT  /api/store-settings/                staff only

POST /api/coupons/validate/

POST /api/orders/
GET  /api/orders/my/                    authenticated customer only
GET  /api/orders/                       staff only
PATCH /api/orders/<id>/status/          staff only; status + tracking_number

GET    /api/admin-dashboard/summary/    staff only
GET    /api/admin-dashboard/coupons/    staff only
POST   /api/admin-dashboard/coupons/    staff only
PATCH  /api/admin-dashboard/coupons/<id>/ staff only
DELETE /api/admin-dashboard/coupons/<id>/ staff only
GET    /api/admin-dashboard/reviews/    staff only
PATCH  /api/admin-dashboard/reviews/<id>/ staff only; approve/unapprove
DELETE /api/admin-dashboard/reviews/<id>/ staff only
GET    /api/admin-dashboard/stock-alerts/ staff only
GET    /api/admin-dashboard/analytics/  staff only
GET    /api/admin-dashboard/categories/ staff only
POST   /api/admin-dashboard/categories/ staff only
PATCH  /api/admin-dashboard/categories/<id>/ staff only
DELETE /api/admin-dashboard/categories/<id>/ staff only
GET    /api/admin-dashboard/products/   staff only
POST   /api/admin-dashboard/products/   staff only
PATCH  /api/admin-dashboard/products/<id>/ staff only
DELETE /api/admin-dashboard/products/<id>/ staff only
GET    /api/admin-dashboard/orders/     staff only
PATCH  /api/admin-dashboard/orders/<id>/status/ staff only; status + tracking_number
```

Public product/category GET endpoints remain accessible. Product/category admin writes and order management writes require staff/admin authentication.
`POST /api/orders/` accepts an optional `email` field. If provided, it must be a valid email address. If omitted by a logged-in customer, the backend uses the account email when available.

## Auth Payload Examples

Register:

```json
{
  "username": "amina",
  "email": "amina@example.com",
  "first_name": "Amina",
  "last_name": "El Idrissi",
  "phone": "+212 600 000 000",
  "city": "Casablanca",
  "address": "Street, building, floor",
  "password": "StrongPassword123!",
  "password_confirm": "StrongPassword123!"
}
```

Login:

```json
{
  "username": "amina",
  "password": "StrongPassword123!"
}
```

Profile update:

```json
{
  "phone": "+212 600 111 222",
  "city": "Rabat",
  "address": "Updated delivery address"
}
```

Coupon validation:

```json
{
  "code": "WELCOME10",
  "subtotal": "500.00"
}
```

Successful coupon validation returns:

```json
{
  "valid": true,
  "code": "WELCOME10",
  "discount_type": "percentage",
  "discount_value": "10.00",
  "discount_amount": "50.00",
  "message": "Promo code applied."
}
```

## Demo Data

```bash
python manage.py seed_demo
```

This creates active categories, luxury products, stock levels, ratings, featured products, and SVG media files under `backend/media/`.

## Validation

This backend-auth step was checked with:

```bash
python manage.py check
python manage.py migrate --noinput
npm run build
```

Smoke tests covered backend register, login, authenticated `me`, `PUT /api/auth/profile/`, logout, public product GET, and guest rejection for protected admin write endpoints.

Frontend browser checks covered register page load, login page load, register with token storage, login with backend token, account page loading after login, profile update persistence, logout token clearing, and guest redirect from `/account` to `/login`.

Step 3 checks covered guest redirect away from `/admin-dashboard`, normal-user access denial, hidden Admin nav for normal users, staff/admin dashboard access, visible Admin nav for staff, staff product create/update/delete, and normal-user rejection for product writes.

Step 4 checks covered guest checkout, logged-in checkout linked to the user, isolated `/api/orders/my/` results between users, account order-history rendering, empty order-history state, profile update, and logout.

Step 5 checks covered Django system checks, migrations, frontend build, public settings GET, guest PUT rejection, normal-user PUT rejection, staff/admin settings update, settings restore, and dynamic checkout/footer wiring in the React code.

Step 6 checks covered `/`, `/shop`, `/cart`, `/checkout`, `/login`, `/register`, `/account`, `/admin-dashboard`, `/about`, `/contact`, `/delivery`, and `/returns` route responses; product API loading; guest checkout; logged-in checkout; account order history; staff-only admin dashboard API access; store settings update and restore; dynamic settings usage in footer, checkout, and store pages; headless Chrome DOM rendering for the contact page; `python manage.py check`; `python manage.py migrate --noinput`; `npm run build`; and `npm audit` with 0 vulnerabilities.

Step 7 checks covered `npm run build`, `npm audit` with 0 vulnerabilities, route responses for `/`, `/shop`, `/about`, `/contact`, `/delivery`, `/returns`, and a product details page, public `robots.txt`, public `sitemap.xml`, and headless Chrome DOM verification for product title, Open Graph tags, Twitter card, Organization JSON-LD, and Product JSON-LD. Chrome emitted a local Google Update registry warning during headless testing; no page runtime error hints were detected.

Step 8 checks covered `python manage.py check`, `python manage.py migrate --noinput`, `npm run build`, `npm audit` with 0 vulnerabilities, backend startup through `START_BACKEND.bat`, frontend startup through `START_FRONTEND.bat`, one-click startup through `START_ALL.bat`, product loading, login, checkout, account order history, staff-only admin access, store settings update/restore, shop/product/login/admin/checkout route responses, and public `robots.txt`/`sitemap.xml` responses.

Step 9 final QA covered Django checks, migrations, Vite production build, `npm audit` with 0 vulnerabilities, product API response, public `robots.txt` and `sitemap.xml` responses, API smoke tests for products, filters, auth, guest checkout, logged-in checkout, order history, admin protection, admin product CRUD, normal-user write rejection, and store settings update/restore. The final `npm audit` rerun after README-only edits may require npm registry/cache access; the same `package-lock.json` passed with 0 vulnerabilities during Step 9.

Step 9 visual QA produced final desktop/mobile screenshots in `PROJECT_SCREENSHOTS/` and sampled homepage, shop, account, admin dashboard, and mobile checkout rendering for spacing, alignment, responsive layout, and dark luxury styling. Automated browser-console inspection was attempted with raw Chrome/Edge DevTools and the Codex in-app browser bridge, but the local Windows sandbox/headless browser target was unstable; use a normal desktop browser DevTools pass before production deployment.

New Feature 1 checks covered `python manage.py migrate --noinput`, `python manage.py check`, `npm run build`, guest checkout, logged-in checkout, staff/admin status update, staff/admin tracking number update, customer order history showing the updated status and tracking number, another customer being unable to see that order, and normal-user rejection from the protected admin order update endpoint.

New Feature 2 checks covered `python manage.py migrate --noinput`, `python manage.py check`, `python manage.py makemigrations --check --dry-run`, `npm run build`, public coupon validation for valid percentage and fixed coupons, invalid coupon code, expired coupon, inactive coupon, minimum-order rejection, maximum-discount cap, usage-limit exhaustion, backend-secure total recalculation, guest checkout with no coupon, logged-in checkout with coupon, coupon `used_count` increment after order creation, staff/admin coupon create/edit/delete, and normal-user rejection from protected coupon CRUD.

New Feature 3 checks covered `python manage.py migrate --noinput`, `python manage.py check`, `python manage.py makemigrations --check --dry-run`, `npm run build`, public approved-review visibility, guest review submission rejection, authenticated no-purchase rejection, delivered-buyer review creation, duplicate-review rejection, rating range validation, owner-only edit/delete, unapproved-review hiding, calculated average rating and review count, staff/admin approve/unapprove/delete, normal-user rejection from admin review management, and smoke coverage for existing products, checkout, coupons, cart, and account endpoints.

New Feature 4 checks covered `python manage.py check`, `python manage.py migrate --noinput`, `python manage.py makemigrations --check --dry-run`, `npm run build`, guest wishlist API rejection, logged-in add, duplicate prevention, logged-in remove, user isolation, persistence through a fresh authenticated client, navbar/count state wiring through `WishlistContext`, product delete cascade cleanup, public products, product detail, reviews, review summary, coupon validation, guest checkout, logged-in checkout, and account order-history endpoints.

New Feature 5 checks covered `python manage.py check`, `python manage.py migrate --noinput`, `python manage.py makemigrations --check --dry-run`, `npm run build`, product stock status calculation for out-of-stock, low-stock, and in-stock products, product serializer stock fields, out-of-stock order rejection, inactive product rejection, unavailable quantity rejection, duplicate-line aggregate quantity rejection, stock unchanged after rejected orders, valid order stock decrement, non-negative stock after rejected oversized orders, guest checkout, logged-in checkout, account orders, staff stock-alert endpoint, stock-alert counts, staff stock/threshold update, normal-user stock-alert rejection, guest stock-alert rejection, order tracking update, wishlist, public reviews, review summary, and coupon validation.

New Feature 6 checks covered `python manage.py check`, `python manage.py migrate --noinput`, `python manage.py makemigrations --check --dry-run`, `npm run build`, `npm audit` with 0 vulnerabilities, guest analytics rejection, normal-user analytics rejection, staff/admin analytics access, revenue excluding cancelled orders, documented pending-order revenue rule, date filters, `12m` monthly grouping, order status counts, average order value, top-selling products by quantity and revenue, coupon discount totals, delivery revenue totals, low-stock analytics data, recent orders, product CRUD endpoint, orders endpoint, coupons endpoint, reviews endpoint, stock alerts endpoint, wishlist endpoint, checkout, and account orders. The Vite build completed successfully and emitted a chunk-size warning after adding Recharts; this is a performance note, not a build failure.

New Feature 7 checks covered `python manage.py check`, `python manage.py migrate --noinput`, `python manage.py makemigrations --check --dry-run`, `npm run build`, `npm.cmd audit` with 0 vulnerabilities, DRF smoke tests with `locmem` email backend, guest checkout with confirmation email, guest checkout without email, logged-in checkout account-email prefill, admin new-order notification through `StoreSettings.email`, customer status/tracking update email, duplicate prevention for unchanged status/tracking, invalid email rejection, and simulated SMTP failure not breaking checkout or admin status updates. Surrounding API smoke tests covered products, store settings, coupon validation, account orders, staff/guest analytics access, stock alerts, reviews, wishlist, admin coupons, admin reviews, and admin orders. The simulated SMTP failure intentionally logs stack traces while the API calls still succeed.

## New Feature 8A - Frontend Multi-language UI

The React frontend now uses `i18next` and `react-i18next` for French, Arabic, and English UI translations.

- Default language is French (`fr`).
- Supported language codes are `fr`, `ar`, and `en`.
- The selected language is saved in localStorage under `ecom_3d_language`.
- The app restores the saved language after refresh.
- Arabic automatically sets `document.documentElement.dir = "rtl"` and `lang = "ar"`.
- French and English use `dir = "ltr"`.
- Translation files live in `frontend/src/i18n/locales/`.
- The navbar includes a premium language switcher: `FR`, `العربية`, `EN`.
- Static UI text across the navbar, mobile navigation, footer, home, shop, cart, checkout, auth pages, account, wishlist, info pages, product details, reviews, order tracking, admin dashboard, coupons, stock labels, analytics labels, success messages, error messages, empty states, buttons, and form labels is routed through translations.
- SEO page titles/descriptions now use translated static copy where possible.
- Dates and admin/customer order timestamps use locale-aware formatting where practical.
- Product and category names/descriptions remain backend content and are not database-translated in this step.

Feature 8A validation covered:

```bash
npm run build
npm audit
```

`npm run build` completed successfully. `npm audit` required normal npm registry/cache access after the sandboxed attempt failed at the advisory endpoint; the approved run reported 0 vulnerabilities. Vite emitted the existing large-bundle warning because the app includes charting/animation libraries; this is a performance note, not a build failure.

## Final Backup

The final delivery ZIP should be created at:

```text
C:\Users\asus\Desktop\codx\ECOM_3D_STORE_FINAL.zip
```

The clean backup excludes `node_modules`, `.git`, `__pycache__`, local `.env` files, virtual environments, temporary files, logs, and generated build/cache folders while keeping source code, `README.md`, run scripts, `.env.example` files, media/demo assets, SQLite development database, and `PROJECT_SCREENSHOTS/`.

## Deployment Checklist

- Replace localhost values in `frontend/public/robots.txt`, `frontend/public/sitemap.xml`, and SEO site URL environment values with the real domain.
- Set backend `DEBUG=False`.
- Set a strong production `SECRET_KEY`.
- Set production `ALLOWED_HOSTS`.
- Set production `CORS_ALLOWED_ORIGINS`.
- Set production SMTP email variables and verify order emails with a real test inbox.
- Move from SQLite to PostgreSQL for production.
- Configure static file serving and uploaded media storage.
- Set `VITE_API_BASE_URL` to the deployed backend API URL.
- Run `python manage.py check`, `python manage.py migrate --noinput`, `npm run build`, and a real-browser console pass before launch.

## Web Scraping Feature

The project includes an isolated **Avito Market Analysis** module powered by
`requests` and `BeautifulSoup`.

- It collects at most 30 public listing records from a public Avito search page.
- It stores title, displayed price, numeric price, city, public image URL, public
  listing URL, source, and collection time in SQLite.
- It does not collect phone numbers or private seller information.
- It does not use private APIs, solve CAPTCHAs, or bypass access controls.
- Repeated runs update matching listing URLs instead of creating duplicates.
- Avito may block live collection with a Cloudflare browser challenge. The
  scraper reports this safely and does not attempt to bypass the protection.
- Twelve clearly marked demo electronics listings are available for school
  presentation and local market-analysis screenshots.
- The public analysis API is `GET /api/avito-listings/`.
- The React analysis page is `/avito-market`.

Install the backend requirements, then run:

```bash
cd backend
python manage.py scrape_avito --url "https://www.avito.ma/fr/maroc/t%C3%A9l%C3%A9phones-%C3%A0_vendre" --limit 30
```

When live scraping is unavailable, seed the presentation dataset:

```bash
python manage.py seed_avito_demo
```

Demo records use existing local electronics images, contain no phone numbers or
private seller information, and are returned with `is_demo: true`. The API also
returns `demo_count` and `live_count` so the frontend can distinguish the two
sources transparently.

The command waits briefly before its single search-page request and fails safely
when Avito returns a browser challenge, rate limit, or changed markup. Respect
Avito's current terms and automated-access rules before running it in any hosted
environment.
