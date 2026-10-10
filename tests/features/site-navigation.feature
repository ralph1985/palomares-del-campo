Feature: Navegación global

  Scenario: El visitante puede abrir y cerrar el menú lateral
    Given el visitante está en la portada
    When abre el menú «Explorar»
    Then el menú lateral aparece
    And puede cerrarlo con el botón de cierre

  Scenario: El menú mantiene el acceso al juego
    Given el visitante está en la portada
    When abre el menú «Explorar»
    Then encuentra el enlace «La bola»
