# Release policy v1: every possible case

| bits (f t a3 a2 a1) | situation | result |
|---|---|---|
| 00000 | no approvals · timelock not passed · not frozen | ⛔ blocked |
| 00001 | approved by M1 · timelock not passed · not frozen | ⛔ blocked |
| 00010 | approved by M2 · timelock not passed · not frozen | ⛔ blocked |
| 00011 | approved by M1, M2 · timelock not passed · not frozen | ⛔ blocked |
| 00100 | approved by M3 · timelock not passed · not frozen | ⛔ blocked |
| 00101 | approved by M1, M3 · timelock not passed · not frozen | ⛔ blocked |
| 00110 | approved by M2, M3 · timelock not passed · not frozen | ⛔ blocked |
| 00111 | approved by M1, M2, M3 · timelock not passed · not frozen | ✅ can go live |
| 01000 | no approvals · timelock passed · not frozen | ⛔ blocked |
| 01001 | approved by M1 · timelock passed · not frozen | ⛔ blocked |
| 01010 | approved by M2 · timelock passed · not frozen | ⛔ blocked |
| 01011 | approved by M1, M2 · timelock passed · not frozen | ✅ can go live |
| 01100 | approved by M3 · timelock passed · not frozen | ⛔ blocked |
| 01101 | approved by M1, M3 · timelock passed · not frozen | ✅ can go live |
| 01110 | approved by M2, M3 · timelock passed · not frozen | ✅ can go live |
| 01111 | approved by M1, M2, M3 · timelock passed · not frozen | ✅ can go live |
| 10000 | no approvals · timelock not passed · FROZEN | ⛔ blocked |
| 10001 | approved by M1 · timelock not passed · FROZEN | ⛔ blocked |
| 10010 | approved by M2 · timelock not passed · FROZEN | ⛔ blocked |
| 10011 | approved by M1, M2 · timelock not passed · FROZEN | ⛔ blocked |
| 10100 | approved by M3 · timelock not passed · FROZEN | ⛔ blocked |
| 10101 | approved by M1, M3 · timelock not passed · FROZEN | ⛔ blocked |
| 10110 | approved by M2, M3 · timelock not passed · FROZEN | ⛔ blocked |
| 10111 | approved by M1, M2, M3 · timelock not passed · FROZEN | ⛔ blocked |
| 11000 | no approvals · timelock passed · FROZEN | ⛔ blocked |
| 11001 | approved by M1 · timelock passed · FROZEN | ⛔ blocked |
| 11010 | approved by M2 · timelock passed · FROZEN | ⛔ blocked |
| 11011 | approved by M1, M2 · timelock passed · FROZEN | ⛔ blocked |
| 11100 | approved by M3 · timelock passed · FROZEN | ⛔ blocked |
| 11101 | approved by M1, M3 · timelock passed · FROZEN | ⛔ blocked |
| 11110 | approved by M2, M3 · timelock passed · FROZEN | ⛔ blocked |
| 11111 | approved by M1, M2, M3 · timelock passed · FROZEN | ⛔ blocked |
