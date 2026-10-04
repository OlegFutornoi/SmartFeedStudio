# Coverage Tracker — Трекер покриття матриці сценаріїв

## Карта доменного покриття SmartFeed Studio

| Домен                | Create | Read/Filter | Cascade Delete |  Mock Mode  | Real Mode | Bilingual (UA/EN) |
| -------------------- | :----: | :---------: | :------------: | :---------: | :-------: | :---------------: |
| **Feeds**            |   ✅   |     ✅      |       ✅       |     ✅      |    ✅     |        ✅         |
| **Products**         |   ✅   |     ✅      |       ✅       |     ✅      |    ✅     |        ✅         |
| **Suppliers**        |   ✅   |     ✅      |       ✅       |     ✅      |    ✅     |        ✅         |
| **Users / Teams**    |   ✅   |     ✅      |       ✅       | N/A (Cloud) |    ✅     |        ✅         |
| **Licenses / Plans** |   ✅   |     ✅      |       ✅       | N/A (Cloud) |    ✅     |        ✅         |
| **Navigation Items** |   ✅   |     ✅      |       ✅       | N/A (Cloud) |    ✅     |        ✅         |

При додаванні нового домену або операції: оновити таблицю та додати відповідний сьют у `apps/desktop/e2e` або `apps/admin-portal/e2e`.
