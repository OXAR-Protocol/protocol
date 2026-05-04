---
description: Brainstorm OXAR content angles via oxar-creative agent. Pair with /tweet to write copy from chosen angle.
argument-hint: [topic, release, or theme — optional]
---

Запусти агента `oxar-creative` с задачей сгенерировать content angles для OXAR.

Тема / повод: `$ARGUMENTS`

Если контекст пустой — попроси evergreen-набор из 8-10 углов (микс product / culture / tech-receipts / negative-space / manifesto).

Если контекст есть — все углы вокруг повода, разными подходами.

Агент сам прочитает `~/Brain/20-Projects/OXAR/` для контекста и стратегии. Верни вывод пользователю — он выберет angle, потом запустит `/tweet <angle>` чтобы получить копи.
