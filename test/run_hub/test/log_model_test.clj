(ns run-hub.test.log-model-test
  (:require [midje.sweet :refer :all]
            [clj-time.core :as time]
            [run-hub.models.log :as log]))

(fact
 "Mike's log yields dates from January 1, 2012 onward"
 (take 5 (log/training-dates))
 => [(time/date-time 2012 1 1)
     (time/date-time 2012 1 2)
     (time/date-time 2012 1 3)
     (time/date-time 2012 1 4)
     (time/date-time 2012 1 5)])

(fact
 "Date's are formatted like so"
 (log/format-date (time/date-time 2012 1 1))
 => "January 1, 2012")

(facts
 "The date I've been using for my running logs translates
  to a date object"
 (fact (log/parse-date "1/1/2012") => (time/date-time 2012 1 1))
 (fact (log/parse-date "01/01/2012") => (time/date-time 2012 1 1))
 (fact (log/parse-date "8/20/2012") => (time/date-time 2012 8 20))
 (fact (log/parse-date "10/17/2011") => (time/date-time 2011 10 17)))

(fact
 "An input of my training as a map produces a sequence of
  of dates and workouts, ordered by date from past to future"
 (let [earliest {:when (time/date-time 2011 1 1) :workouts []}
       middle {:when (time/date-time 2012 1 1) :workouts []}
       latest {:when (time/date-time 2012 1 2) :workouts []}
       training [middle latest earliest]]
   (log/order-training-by-date training) => [earliest middle latest]))

(facts
 "We can get the previous Sunday for a date"
 (fact (log/previous-sunday (time/date-time 2012 8 22))
       => (time/date-time 2012 8 19))
 (fact (log/previous-sunday (time/date-time 2012 1 3))
       => (time/date-time 2012 1 1))
 (fact (log/previous-sunday (time/date-time 2012 1 1))
       => (time/date-time 2012 1 1)))

(facts
 "Days of the same week stack inside the same map key"
 (fact (log/compress-training {}
                              {:when (time/date-time 2012 1 1) :workouts []})
       =>  {(time/date-time 2012 1 1) []})
 
 (fact (log/compress-training {(time/date-time 2012 1 1) [1]}
                              {:when (time/date-time 2012 1 20) :workouts [2]})
       => {(time/date-time 2012 1 1) [1]
           (time/date-time 2012 1 15) [2]})
 
 (fact (log/compress-training {(time/date-time 2012 1 1) [1]}
                              {:when (time/date-time 2012 1 2) :workouts [2]})
       => {(time/date-time 2012 1 1) [1 2]}))

(fact
 "Workouts can be grouped by week"
 (let [future-week {:when (time/date-time 2012 1 20) :workouts [5]}
       past-week {:when (time/date-time 2012 1 2) :workouts [3 4]}
       very-past-week {:when (time/date-time 2012 1 1) :workouts [1 2]}
       training [future-week past-week very-past-week]]
   (log/group-by-week training)
   => {(time/date-time 2012 1 1) [1 2 3 4]
       (time/date-time 2012 1 15) [5]}))

(comment
(facts
 "Mileage per week is calculated"
 (fact
  (let [training
        (log/group-by-week [{(time/date-time 2012 1 1) [{:length 10}]}
                            {(time/date-time 2012 1 2) [{:length 20}]}])]
    (log/miles-per-week training)
    => [{(time/date-time 2012 1 1) {:miles 30 :workouts [{:length 10} {:length 20}]}}]))
 (fact
  (let [training
        (log/group-by-week [{(time/date-time 2012 1 1) [{:length 10}]}
                            {(time/date-time 2012 1 2) [{:length 20}]}
                            {(time/date-time 2011 1 2) [{:length 50}]}])]
    (log/miles-per-week training)
    => [{(time/date-time 2011 1 2) {:miles 50 :workouts [{:length 50}]}}
        {(time/date-time 2012 1 1) {:miles 30 :workouts [{:length 10} {:length 20}]}}])))

)