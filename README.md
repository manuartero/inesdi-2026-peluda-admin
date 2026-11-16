<div align="center">

<img src="public/favicon.svg" alt="Peluda Admin logo: a white paw on an orange tile" width="96" height="96" />

# Peluda Admin

**The backoffice of a pet-food company that does not exist.**
Tickets, customers, contracts and reviews to practise prompt engineering on.

[![Fake CMS: for teaching only](https://img.shields.io/badge/%E2%9A%A0%EF%B8%8F%20fake%20CMS-for%20teaching%20only-d9773b?style=for-the-badge)](#what-this-is)
[![INESDI 2026: Máster de FP en IA aplicada a la empresa](https://img.shields.io/badge/INESDI%202026-M%C3%A1ster%20FP%20en%20IA%20aplicada%20a%20la%20empresa-1f2937?style=for-the-badge)](#what-this-is)

[![Vercel](https://img.shields.io/badge/-Vercel-000000?style=flat-square&logo=vercel&logoColor=white)](https://inesdi-2026-peluda-admin.vercel.app)
![Node 24](https://img.shields.io/badge/node-24-5FA04E?style=flat-square&logo=nodedotjs&logoColor=white)
![React 19](https://img.shields.io/badge/react-19-61DAFB?style=flat-square&logo=react&logoColor=black)
![Vite 8](https://img.shields.io/badge/vite-8-646CFF?style=flat-square&logo=vite&logoColor=white)
![Coverage 84 %](https://img.shields.io/badge/coverage-84%25-4c1?style=flat-square)

<img src="docs/screenshots/home.png" alt="Peluda Admin home: unclassified tickets, unanswered reviews and company indicators" width="900" />

</div>

## What this is

> [!WARNING]
> **Peluda is fictional.** The company, its customers, suppliers, contracts, tickets and reviews are all invented for a classroom. No real person, email, phone or tax ID is in here.

Peluda Admin is teaching material for the workshop *Prompt engineering estratégico* of the **Máster de FP en Inteligencia Artificial Aplicada a la Empresa** at **INESDI** (2026 edition). Students open it like a real support team would, copy a ticket, a contract or a review with **«Copiar para el prompt»**, paste it into a chat assistant and practise writing the prompt that handles it: classify the inbox, spot the trap in a contract clause, answer a review in the brand's voice.

The UI and the content are in Spanish; the code is in English.

## Screens

<table>
  <tr>
    <td width="50%"><img src="docs/screenshots/tickets.png" alt="Ticket inbox filtered by day and country" /><br /><b>Ticket inbox</b> · 451 unclassified tickets, filters by day and country, CSV export</td>
    <td width="50%"><img src="docs/screenshots/ticket-detail.png" alt="Ticket TCK-0004 with the customer, pet, plan and order history" /><br /><b>Ticket detail</b> · the message next to the customer record, ready to copy into a prompt</td>
  </tr>
  <tr>
    <td><img src="docs/screenshots/customer.png" alt="Customer record with two subscriptions, pets and orders" /><br /><b>Customer record</b> · subscriptions, pets, orders and charges, tickets and reviews</td>
    <td><img src="docs/screenshots/contract.png" alt="Supplier contract with its clauses and expiry date" /><br /><b>Supplier contract</b> · the full text, with the traps a good prompt should catch</td>
  </tr>
  <tr>
    <td><img src="docs/screenshots/reviews.png" alt="Reviews list with stars, channel and answered status" /><br /><b>Reviews</b> · web, app and Google reviews, answered and unanswered</td>
    <td>
      <b>Also inside</b>
      <ul>
        <li><b>Marca</b>: the brand voice guide, for writing replies</li>
        <li>Previous / next arrows that keep the list's filters</li>
        <li>«Exportar CSV» on every list, Excel-friendly (<code>;</code>, UTF-8 BOM)</li>
      </ul>
    </td>
  </tr>
</table>

## Contributing

How to run it, the commands, the data model and the stack: [`CONTRIBUTING.md`](CONTRIBUTING.md).

## License

[MIT](LICENSE) © 2026 Manuel Artero Anguita. Use it, fork it, run your own workshop with it.

<div align="center">
<sub>Made for the INESDI 2026 prompt engineering workshop · Peluda, its pets and its people are made up 🐾</sub>
</div>
