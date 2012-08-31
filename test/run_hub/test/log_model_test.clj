(ns run-hub.test.log-model-test
  (:require [midje.sweet :refer :all]
            [clj-time.core :as time]
            [zombie.core :refer :all]
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

(facts
 "I can get the name of the day for a date"
 (fact (log/day-name-for (time/date-time 2012 1 1)) => "Sunday")
 (fact (log/day-name-for (time/date-time 2012 8 27)) => "Monday") 
 (fact (log/day-name-for (time/date-time 2012 8 31)) => "Friday"))

(def workout {:when (time/date-time 2012 1 1) :miles 7})

(facts
 "Workouts can be grouped by day"
 (fact
  (log/group-by-day []) => [])

 (fact
  (specified-by
   [a workout
    b (is-like a)]
   (log/group-by-day all)
   => [{:when (:when a) :workouts [a b]}]))

 (fact
  (specified-by
   [a workout
    b (is-like a (but-it (has-a-later :when)))]
   (log/group-by-day all)
   => [{:when (:when a) :workouts [a]}
       {:when (:when b) :workouts [b]}]))

 (fact
  (specified-by
   [a workout
    b (is-like a)
    c (is-like b (but-it (has-a-later :when)))
    d (is-like c)
    e (is-like d (but-it (has-a-later :when)))]
   (log/group-by-day all)
   => [{:when (:when a) :workouts [a b]}
       {:when (:when c) :workouts [c d]}
       {:when (:when e) :workouts [e]}])))

(fact
 (log/group-by-week []) => [])

(fact
 (specified-by
  [a workout
   b (is-like a)]
  (log/group-by-week all)
  => [{:when (:when a) :days [{:when (:when a) :workouts [a b]}]}]))

(fact
 (specified-by
  [a (assoc workout :when (time/date-time 2012 1 1))
   b (is-like a (but-it (has-one-day-later :when)))
   c (is-like a (but-it (has-one-week-later :when)))]
  (log/group-by-week all)
  => [{:when (:when a) :days [{:when (:when a) :workouts [a]}
                              {:when (:when b) :workouts [b]}]}
      {:when (:when c) :days [{:when (:when c) :workouts [c]}]}]))

(comment
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
   (fact (log/compress-training []
                                {:when (time/date-time 2012 1 1) :workouts []})
         => [{:when (time/date-time 2012 1 1) :workouts []}])
   
   (fact (log/compress-training [{:when (time/date-time 2012 1 1) :workouts [{:when (time/date-time 2012 1 1)}]}]
                                {:when (time/date-time 2012 1 20) :workouts [{}]})
         => [{:when (time/date-time 2012 1 1) :workouts [{:when (time/date-time 2012 1 1)}]}
             {:when (time/date-time 2012 1 15) :workouts [{:when (time/date-time 2012 1 20)}]}])
   
   (fact (log/compress-training [{:when (time/date-time 2012 1 1) :workouts [{:when (time/date-time 2012 1 1)}]}]
                                {:when (time/date-time 2012 1 2) :workouts [{:when (time/date-time 2012 1 1)}]})
         => [{:when (time/date-time 2012 1 1) :workouts [{:when (time/date-time 2012 1 1)}
                                                         {:when (time/date-time 2012 1 2)}]}]))

  (facts
   (fact (log/find-in-array-map [{:a 1 :b 2} {:c 3 :d 4}] :a 1) => {:a 1 :b 2})
   (fact (log/find-in-array-map [{:a 1 :b 2} {:c 3 :d 4}] :a 5) => {})
   (fact (log/find-in-array-map [{:a 1 :b 2}] :b 2) => {:a 1 :b 2})
   (fact (log/find-in-array-map [] :a 1) => {}))

  (facts
   (fact (log/update-in-array-map [{:a 1}] :a 1 :b 3) => [{:a 1 :b 3}])
   (fact (log/update-in-array-map [{:a 1} {:b 2}] :b 2 :c 3) => [{:a 1} {:b 2 :c 3}])
   (fact (log/update-in-array-map [{:a 1} {:b 2} {:c 3}] :c 4 :d 5) => [{:a 1} {:b 2} {:c 3} {:c 4 :d 5}])
   (fact (log/update-in-array-map [{:a 1 :b 2}] :b 2 :c 3) => [{:a 1 :b 2 :c 3}]))

  (fact
   "Workouts can be grouped by week"
   (let [future-week {:when (time/date-time 2012 1 20) :workouts [{}]}
         past-week {:when (time/date-time 2012 1 2) :workouts [{} {}]}
         very-past-week {:when (time/date-time 2012 1 1) :workouts [{} {}]}
         training [future-week past-week very-past-week]]
     (log/group-by-week training)
     => [{:when (time/date-time 2012 1 1) :workouts [{:when (time/date-time 2012 1 1)}
                                                     {:when (time/date-time 2012 1 1)}
                                                     {:when (time/date-time 2012 1 2)}
                                                     {:when (time/date-time 2012 1 2)}]}
         {:when (time/date-time 2012 1 15) :workouts [{:when (time/date-time 2012 1 20)}]}]))

  (facts
   "Mileage per week is calculated"
   (fact
    (let [training
          (log/group-by-week [{:when (time/date-time 2012 1 1) :workouts [{:miles 10}]}
                              {:when (time/date-time 2012 1 2) :workouts [{:miles 20}]}])]
      (log/miles-per-week training)
      => [{:when (time/date-time 2012 1 1) :miles 30 :days [{:when (time/date-time 2012 1 1) :workouts [{:miles 10}]}
                                                            {:when (time/date-time 2012 1 2) :workouts [{:miles 20}]}]}]))
   (fact
    (let [training
          (log/group-by-week [{:when (time/date-time 2012 1 1) :workouts [{:miles 10}]}
                              {:when (time/date-time 2012 1 2) :workouts [{:miles 20}]}
                              {:when (time/date-time 2011 1 2) :workouts [{:miles 50}]}])]
      (log/miles-per-week training)
      => [{:when (time/date-time 2011 1 2) :miles 50 :days [{:when (time/date-time 2011 1 2) :workouts [{:miles 50}]}]}
          {:when (time/date-time 2012 1 1) :miles 30 :days [{:when (time/date-time 2012 1 1) :workouts [{:miles 10}]}
                                                            {:when (time/date-time 2012 1 2) :workouts [{:miles 20}]}]}])))
  
  (fact
   "Some of my raw workout data gets it's mpw calculated"
   (let [training [{:when (time/date-time 2012 8 19) :workouts [{:duration "44:12"
                                                                 :miles 4.74
                                                                 :type "Very Easy"
                                                                 :pace "9:19"}]}
                   {:when (time/date-time 2012 8 20) :workouts [{:duration "58:14"
                                                                 :miles 6.46
                                                                 :type "Easy"
                                                                 :pace "9:00"}
                                                                {:duration "35:00"
                                                                 :miles 3.65
                                                                 :type "Very Easy"
                                                                 :pace "9:35"}]}
                   {:when (time/date-time 2012 8 21) :workouts [{:duration "1:01:45"
                                                                 :miles 6.74
                                                                 :type "Easy"
                                                                 :pace "9:09"}
                                                                {:duration "25:00"
                                                                 :miles 2.63
                                                                 :type "Very Easy"
                                                                 :pace "9:30"}]}
                   {:when (time/date-time 2012 8 22) :workouts [{:duration "1:33:55"
                                                                 :miles 11.93
                                                                 :type "CV Intervals"
                                                                 :notes "9 x 800m, 90s recovery: 3:04, 2:59, 2:59, 3:00, 2:58, 2:59, 2:57, 2:58, 3:00 | 8 x 30s fast, 60s recovery"}
                                                                {:duration "25:00"
                                                                 :miles 2.54
                                                                 :type "Very Easy"
                                                                 :pace "9:50"}]}
                   {:when (time/date-time 2012 8 23) :workouts [{:duration "59:50"
                                                                 :miles 6.32
                                                                 :type "Very Easy"
                                                                 :pace "9:28"}
                                                                {:duration "42:20"
                                                                 :miles 4.80
                                                                 :type "Very Easy"
                                                                 :pace "8:49"}]}
                   {:when (time/date-time 2012 8 24) :workouts [{:duration "58:36"
                                                                 :miles 6.32
                                                                 :type "Easy"
                                                                 :pace "9:16"}
                                                                {:duration "25:00"
                                                                 :miles 2.63
                                                                 :type "Very Easy"
                                                                 :pace "9:30"}]}
                   {:when (time/date-time 2012 8 25) :workouts [{:duration "1:16:26"
                                                                 :miles 8.33
                                                                 :type "Easy Hills"
                                                                 :pace "9:10"
                                                                 :notes "Valley Forge trails"}]}]]
     (:miles (first (log/miles-per-week (log/group-by-week training)))) => 67.09)))

