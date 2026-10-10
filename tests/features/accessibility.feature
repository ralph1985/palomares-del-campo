Feature: Accesibilidad básica

  Scenario: Los controles principales tienen nombre accesible
    Given el visitante abre la portada
    Then el botón de explorar tiene un nombre accesible
    And el botón de cierre del menú tiene un nombre accesible

  Scenario: La página del juego mantiene el contenido en móvil
    Given el visitante abre el juego en una pantalla estrecha
    Then la página no tiene desplazamiento horizontal
