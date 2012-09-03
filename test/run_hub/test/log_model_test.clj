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

(facts
 "We can get the previous Sunday for a date"
 (fact (log/previous-sunday (time/date-time 2012 8 22))
       => (time/date-time 2012 8 19))
 (fact (log/previous-sunday (time/date-time 2012 1 3))
       => (time/date-time 2012 1 1))
 (fact (log/previous-sunday (time/date-time 2012 1 1))
       => (time/date-time 2012 1 1)))

(def workout {:when (time/date-time 2012 1 1) :miles 7})

(facts
 "Workouts can be grouped by day"
 (fact
  (log/group-by-day []) => {})

 (fact
  (specified-by
   [a workout
    b (is-like a)]
   (log/group-by-day all)
   => {(:when a) [a b]}))

 (fact
  (specified-by
   [a workout
    b (is-like a (but-it (has-a-later :when)))]
   (log/group-by-day all)
   => {(:when a) [a]
       (:when b) [b]}))

 (fact
  (specified-by
   [a workout
    b (is-like a)
    c (is-like b (but-it (has-a-later :when)))
    d (is-like c)
    e (is-like d (but-it (has-a-later :when)))]
   (log/group-by-day all)
   => {(:when a) [a b]
       (:when c) [c d]
       (:when e) [e]})))

(fact
 (log/group-by-week []) => {})

(fact
 (specified-by
  [a workout
   b (is-like a)]
  (log/group-by-week all)
  => {(:when a) [[(:when a) [a b]]]}))

(fact
 (specified-by
  [a (assoc workout :when (time/date-time 2012 1 1))
   b (is-like a (but-it (has-one-day-later :when)))
   c (is-like a (but-it (has-one-week-later :when)))]
  (log/group-by-week all)
  => {(:when a) [[(:when a) [a]]
                 [(:when b) [b]]]
      (:when c) [[(:when c) [c]]]}))

(fact
 (log/weekly-mileage [workout])
 => [{:when (:when workout)
      :miles (:miles workout)
      :days [[(:when workout) [workout]]]}])

(fact
 (specified-by
  [a workout
   b (is-like a)]
  (log/weekly-mileage all)
  => [{:when (:when a)
       :miles (+ (:miles a) (:miles b))
       :days [[(:when a) [a b]]]}]))

(fact
 (specified-by
  [a workout
   b (is-like a (but-it (has-one-day-later :when)))]
  (log/weekly-mileage all)
  => [{:when (:when a)
       :miles (+ (:miles a) (:miles b))
       :days [[(:when a) [a]]
              [(:when b) [b]]]}]))

