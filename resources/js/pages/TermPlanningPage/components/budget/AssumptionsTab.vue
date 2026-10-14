<template>
  <div
    class="scrollbar-always-visible tw-min-h-0 tw-flex-1 tw-overflow-auto tw-px-[18px] tw-py-4"
  >
    <div
      class="rules tw-flex tw-max-w-[760px] tw-flex-col tw-gap-5 tw-text-[13px]"
    >
      <section>
        <CapsLabel class="tw-mb-1.5 tw-block"
          >Who is costed, and where</CapsLabel
        >
        <ul>
          <li>
            The instructor of record is anyone listed as PI. A section with no
            PI uses the first person listed who isn't a TA. Other roles, such as
            SI, aren't costed.
          </li>
          <li>TAs are the people listed with the TA role.</li>
          <li>
            The People tab lists everyone in one table. Salary, fringe and total
            are this term's totals. Load is the number of paid sections, or for
            a grad student, the sum of their appointment percents.
          </li>
          <li>
            People with no sections this term are listed when their job code has
            an expected load or they are on leave, in a "Not assigned this term"
            group that starts closed.
          </li>
        </ul>
      </section>

      <section>
        <CapsLabel class="tw-mb-1.5 tw-block">Rates</CapsLabel>
        <ul>
          <li>Cost = salary × (1 + fringe rate).</li>
          <li>
            Rates are set per term. The department's salary or fringe replaces
            the default rate, one field at a time.
          </li>
          <li>
            A person with several job codes is costed at the one with the
            highest cost per section.
          </li>
          <li>
            An instructor's own salary replaces their job code's salary. Grad
            students have no salary override; their pay comes from the grad
            inputs.
          </li>
          <li>
            An instructor whose job code has no rate is costed at the
            {{ UNSTAFFED_JOB_CODE }} rate. A TA with no rate is not, and shows
            "No rate".
          </li>
          <li>
            The Rates tab lists the non-grad job codes held by anyone costed
            this term, plus {{ UNSTAFFED_JOB_CODE }}. Recurring-budget faculty
            codes can't be edited there.
          </li>
        </ul>
      </section>

      <section>
        <CapsLabel class="tw-mb-1.5 tw-block">Sections</CapsLabel>
        <ul>
          <li>Cancelled sections cost nothing.</li>
          <li>Independent study (IND) and field work (FWK) cost nothing.</li>
          <li>
            An unstaffed section is costed at the {{ UNSTAFFED_JOB_CODE }} rate.
          </li>
          <li>
            Crosslisted sections are costed once, on the primary listing, or on
            one of them when none is primary.
          </li>
          <li>
            Someone on a course's lecture, in any role, is paid on the lecture
            and not again on that course's labs or discussions. Anyone on a lab
            or discussion but not the lecture is paid there.
          </li>
          <li>
            A person on two sections that meet at the same days and times is
            paid once: on a lecture first, then by course and section number.
          </li>
        </ul>
      </section>

      <section>
        <CapsLabel class="tw-mb-1.5 tw-block">Grad students</CapsLabel>
        <ul>
          <li>
            A grad student is anyone whose job code is a teaching assistant or
            graduate instructor code. ABD comes from the job code.
          </li>
          <li>
            Costs follow the Grad Student Calculator. Pay = hourly rate × hours
            + offsets + per-credit pay. Health = GA health × pay. Tuition =
            tuition per hour (regular or ABD) × hours. Cost = pay + health +
            tuition.
          </li>
          <li>
            Each grad student assignment has its own appointment percent, set in
            section details. Until it is set, a TA assignment, or teaching a lab
            or discussion, is {{ TA_OR_LAB_APPOINTMENT_PERCENT }}%. Teaching any
            other section is the appointment per section taught ({{
              STANDARD_APPOINTMENT_PERCENT
            }}% unless the department changes it).
          </li>
          <li>
            A grad student's appointment is the sum of their assignments'
            percents, with no cap. With no sections it is 0%.
          </li>
          <li>
            Hours come from the term's appointment levels, which the department
            can change. A percent between levels gets hours in proportion to the
            nearest level.
          </li>
          <li>
            The appointment's cost is split across its sections in proportion to
            each section's percent, and each section shows its share.
          </li>
          <li>
            The student fee and international offsets are paid at a quarter
            below a 25% appointment, half from 25% up to 50%, and in full from
            50%. ABD job codes get no fee offset.
          </li>
          <li>
            Graduate instructor codes add per-credit pay for the credits of the
            sections they are paid on as instructor of record. A section with no
            credits counts as 0.
          </li>
        </ul>
      </section>

      <section>
        <CapsLabel class="tw-mb-1.5 tw-block">Load</CapsLabel>
        <ul>
          <li>Expected sections per term = annual load ÷ 2, rounded up.</li>
          <li>
            Under load (shown in red): an instructor paid on fewer sections than
            expected, or a TA paid on none. Someone on leave is never under
            load.
          </li>
        </ul>
      </section>

      <section>
        <CapsLabel class="tw-mb-1.5 tw-block">Terms and history</CapsLabel>
        <ul>
          <li>
            A term is read-only once the SIS has any section for the department
            in it.
          </li>
          <li>
            Previous enrollment covers the last 10 fall and spring terms before
            the one you are viewing.
          </li>
          <li>
            Enrollment tiles are lightest at 40% full or less and darkest from
            95%. A section with no cap counts as full. Tiles are grey when the
            term you are viewing is read-only.
          </li>
        </ul>
      </section>

      <section>
        <CapsLabel class="tw-mb-1.5 tw-block">Filters</CapsLabel>
        <ul>
          <li>
            On the People tab, the person filter shows only the people checked.
            The course, section and component filters keep anyone on a matching
            section, with their whole term's cost.
          </li>
        </ul>
      </section>
    </div>
  </div>
</template>

<script setup lang="ts">
import CapsLabel from "./CapsLabel.vue";
import { UNSTAFFED_JOB_CODE } from "../../helpers/costRules";
import {
  STANDARD_APPOINTMENT_PERCENT,
  TA_OR_LAB_APPOINTMENT_PERCENT,
} from "../../helpers/gradCost";
</script>

<style scoped>
.rules ul {
  margin: 0;
  padding-left: 1.25rem;
}

.rules li {
  margin-bottom: 0.375rem;
  line-height: 1.45;
}
</style>
