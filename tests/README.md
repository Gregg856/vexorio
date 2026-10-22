# VEXORIO — regression checks (read-only)

This is a lightweight safety gate for the single-file website. It does not change production data, perform sign-in, or claim to test browser interactions.

## Run
```bash
node tests/smoke.test.cjs
```

Before each deployment, also manually test on a phone:
1. Open categories, select Zwierzęta → Praca → Motoryzacja → Usługi, and confirm subcategories appear each time.
2. Choose a subcategory, return to Wszystkie, and confirm results update without duplicated category chips.
3. Search for dekarz / murarz and verify that any matching listing is discoverable.
4. Log in with a test account, open an existing listing, and verify that sending a message to another account works.
5. Add and edit a test listing; verify photos, city and country; remove only your own test data afterward.
6. Check that ordinary accounts cannot access administrator actions.

A passing static test is **not** a substitute for these end-to-end checks.
