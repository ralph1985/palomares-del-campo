Feature: Captura local de la bola

  Scenario: Un jugador dentro del radio captura la bola
    Given la bola está en la Plaza del Coso
    And el simulador coloca al jugador en el centro del punto
    When comprueba su posición y captura la bola
    Then recibe 10 puntos
    And la bola cambia de ubicación

  Scenario: Una posición con precisión insuficiente no puede capturar
    Given el simulador coloca al jugador en el punto con precisión insuficiente
    Then el botón de captura permanece desactivado
