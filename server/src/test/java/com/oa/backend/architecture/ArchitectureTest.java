package com.oa.backend.architecture;

import com.tngtech.archunit.base.DescribedPredicate;
import com.tngtech.archunit.core.domain.JavaClass;
import com.tngtech.archunit.junit.AnalyzeClasses;
import com.tngtech.archunit.junit.ArchTest;
import com.tngtech.archunit.lang.ArchRule;
import com.tngtech.archunit.lang.syntax.ArchRuleDefinition;

@AnalyzeClasses(packages = "com.oa.backend")
class ArchitectureTest {

  /**
   * Rule 1: Controllers must not directly inject MyBatis Mapper beans (types in
   * com.oa.backend.mapper).
   */
  @ArchTest
  static final ArchRule no_mapper_injection_in_controllers =
      ArchRuleDefinition.noFields()
          .that()
          .areDeclaredInClassesThat(
              new DescribedPredicate<JavaClass>("are @RestController classes") {
                @Override
                public boolean test(JavaClass javaClass) {
                  return javaClass.isAnnotatedWith(
                      org.springframework.web.bind.annotation.RestController.class);
                }
              })
          .and()
          .haveRawType(
              new DescribedPredicate<JavaClass>("type that resides in the mapper package") {
                @Override
                public boolean test(JavaClass javaClass) {
                  return javaClass.getPackageName().startsWith("com.oa.backend.mapper");
                }
              })
          .should()
          .beAnnotatedWith(org.springframework.beans.factory.annotation.Autowired.class)
          .orShould()
          .beFinal()
          .allowEmptyShould(true)
          .because("controllers must delegate data access to services, not mappers directly");

  /** Rule 2: Service classes must not depend on controller classes. */
  @ArchTest
  static final ArchRule services_must_not_depend_on_controllers =
      ArchRuleDefinition.noClasses()
          .that()
          .resideInAPackage("..service..")
          .should()
          .dependOnClassesThat()
          .resideInAPackage("..controller..");

  /**
   * Rule 3: @Service-annotated classes must reside in the service package. JwtTokenService is
   * excluded — it resides in security package by design (cross-cutting concern).
   */
  @ArchTest
  static final ArchRule service_annotations_only_in_service_package =
      ArchRuleDefinition.classes()
          .that()
          .areAnnotatedWith(org.springframework.stereotype.Service.class)
          .and()
          .doNotHaveSimpleName("JwtTokenService")
          .should()
          .resideInAPackage("com.oa.backend.service..");

  /** Rule 4: @RestController-annotated classes must reside in the controller package. */
  @ArchTest
  static final ArchRule rest_controllers_only_in_controller_package =
      ArchRuleDefinition.classes()
          .that()
          .areAnnotatedWith(org.springframework.web.bind.annotation.RestController.class)
          .should()
          .resideInAPackage("com.oa.backend.controller..");
}
