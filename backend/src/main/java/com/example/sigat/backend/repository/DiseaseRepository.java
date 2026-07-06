package com.example.sigat.backend.repository;

import com.example.sigat.backend.model.Disease;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Query;
import org.springframework.data.repository.query.Param;
import org.springframework.stereotype.Repository;

@Repository
public interface DiseaseRepository extends JpaRepository<Disease, Long> {

    // Antes: "Long findByNameEqualsIgnoreCase(String enfermedad)" generaba
    // automáticamente una consulta que devuelve la entidad Disease completa,
    // no solo su id — Spring Data no usa el tipo de retorno declarado para
    // decidir qué proyectar, y al intentar mapear un Disease dentro de un
    // Long lanzaba "Result type is 'Long' but the query returned a 'Disease'".
    // Con @Query se selecciona explícitamente el campo id, evitando el desajuste.
    @Query("SELECT d.id FROM Disease d WHERE UPPER(d.name) = UPPER(:enfermedad)")
    Long findByNameEqualsIgnoreCase(@Param("enfermedad") String enfermedad);
}