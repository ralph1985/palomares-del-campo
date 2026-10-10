Feature: Noticias editoriales

  Scenario: El visitante puede consultar el archivo de noticias
    Given el visitante abre la sección de noticias
    Then ve el encabezado «Noticias»
    And ve las noticias publicadas

  Scenario: El visitante puede abrir una noticia
    Given el visitante está en el archivo de noticias
    When abre una tarjeta de noticia
    Then ve el título y la fuente de la noticia
