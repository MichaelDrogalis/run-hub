(ns run-hub.models.log
  (:require [clj-time.core :as time]
            [clj-time.format :as format]))

(defn training-dates
  ([] (training-dates (time/date-time 2012 1 1) (time/now) []))
  ([start end interval]
   (if (time/after? start end)
     interval
     (recur (time/plus start (time/days 1)) end (concat interval [start])))))

(defn format-date [date]
  (let [format (format/formatter "MMMM d, YYYY")]
    (format/unparse format date)))

(defn parse-date [date]
  (let [format (format/formatter "MM/dd/yyyy")]
    (format/parse format date)))

(defn order-training-by-date [training]
  (sort-by
   (fn [workout-map]
     (first (keys workout-map)))
   training))

(defn previous-sunday [date]
  (let [day-of-week (.getAsText (.dayOfWeek date))]
    (if (= day-of-week "Sunday")
      date
      (recur (.minusDays date 1)))))

(defn compress-training [training session-date workouts]
  (let [start-of-week (previous-sunday session-date)]
    (assoc training start-of-week
           (concat (get training start-of-week []) workouts))))
    
(defn group-by-week [training]
  (let [ordered-training (order-training-by-date training)]
    (reduce
     (fn [all-training session]
       (let [date (first (keys session))
             workouts (first (vals session))]
         (compress-training all-training date workouts)))
     {}
     ordered-training)))

(defn miles-per-week [training]
  (order-training-by-date  
   (map
    (fn [session]
      {(first session)
       {:miles (apply + (map identity (map :length (second session))))
        :workouts (second session)}})
    training)))

