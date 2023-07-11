<template>
    <div>
    {{  groupId }}

     this report needs to:
     1. fetch all of the courses taught, then fetch all the people who taguht them, for the past three years
     2. fetch all of the term data for the past 3 years
     3. fetch all of the leave data for the aforementioned staff
     4. do that in a performant way

     for #2 - maybe we need to be caching this in bandaid? how hard is this to query? otherwise we could do a nightly scrape from terms.umn.edu by iterating term ids (https://terms.umn.edu/umntc/ugrd/1179)

     SELECT
          CAST(ORA_HASH(institution || acad_career || strm ) AS INTEGER) id,
          institution,
          strm,
          term_begin_dt,
          term_end_dt,
          descr,
          acad_career
        FROM
          #{Rails.configuration.asr_warehouse_schema}.cs_ps_term_tbl


        This should probably:
            1) rely on caching at bandaid for course info
            2) be done server side so we can get some perf benefits from multiple user queries

        return will be...

        user:
            (user info)
            courses:[
                {
                    courseInfo
                    semester (or map this into dates?)
                }    
            ]
            leaves: [
            {
                leaveinfo
            }]

        

    </div>
</template>

<script>
export default {
    props: ['groupId'],
    data() {
        return {

        }
    },
    async mounted() {

        


    },
    computed: {

    },
    methods: {

    }
}

</script>
