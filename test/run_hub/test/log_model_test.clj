(ns run-hub.test.log-model-test
  (:require [midje.sweet :refer :all]
            [clj-time.core :as time]
            [zombie.core :refer :all]
            [run-hub.models.log :as log]))

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

(facts
 (fact (log/formatted-mpw 0) => "0.00")
 (fact (log/formatted-mpw 10) => "10.00")
 (fact (log/formatted-mpw 10.1) => "10.10")
 (fact (log/formatted-mpw 10.25) => "10.25")
 (fact (log/formatted-mpw 10.33333) => "10.33"))

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
 (let [a workout]
   (log/group-by-week [a]) => {(:when a) [a]}))

(fact
 (let [a workout
       b a]
   (log/group-by-week [a b]) => {(:when a) [a b]}))

(fact
 (let [a workout
       b (is-like a (but-it (has-one-week-later :when)))]
   (log/group-by-week [a b]) => {(:when a) [a]
                                 (:when b) [b]}))

(fact
 (log/total-miles []) => 0)

(fact
 (let [a workout]
   (log/total-miles [a]) => (:miles a)))

(fact
 (let [a workout
       b a]
   (log/total-miles [a b]) => (+ (:miles a) (:miles b))))

(fact
 (specified-by
  [a workout
   b (time/plus (:when a) (time/days 1))
   c (time/plus b (time/days 1))
   d (time/plus c (time/days 1))
   e (time/plus d (time/days 1))
   f (time/plus e (time/days 1))
   g (time/plus f (time/days 1))]
  (log/complete-week (:when a) [a])
  => [[(:when a) [a]]
      [b []]
      [c []]
      [d []]
      [e []]
      [f []]
      [g []]]))

(fact
 (specified-by
  [a workout
   b (is-like a (but-it (has-one-week-later :when)))]
  (log/workouts-for-week all (:when a))
  => [a]))

