---
description: Generate OXAR tweet copy via oxar-twitter agent. Pass topic/angle as argument or leave empty for evergreen.
argument-hint: [topic or angle, optional]
---

Запусти агента `oxar-twitter` с задачей написать твиты для OXAR.

Тема / контекст: `$ARGUMENTS`

Если контекст пустой — попроси агента сделать evergreen-сет (3 разных угла: один про продукт, один про vibe, один про числа).

Если контекст есть — все варианты вокруг этой темы, разными форматами.

Агент сам прочитает `~/Brain/20-Projects/OXAR/` для контекста и тона. Тебе нужно только задать ему промпт и вернуть результат пользователю.
