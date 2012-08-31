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

(defn day-name-for [date]
  (.getAsText (.dayOfWeek date)))

(defn order-training-by-date [training]
  (sort-by :when training))

(defn previous-sunday [date]
  (let [day-of-week (.getAsText (.dayOfWeek date))]
    (if (= day-of-week "Sunday")
      date
      (recur (time/minus date (time/days 1))))))

(defn group-by-day [training]
  (group-by :when training))

(defn group-by-week [training]
  (let [grouped-by-day (group-by-day training)]
    (group-by #(previous-sunday (first %)) grouped-by-day)))

(defn weekly-mileage [training]
  (let [grouped-by-week (group-by-week training)]
    [(reduce
      (fn [cumulative-training week]
        {:when (first week)
         :days (second week)
         :miles (reduce (fn [a c] (+ a (:miles c))) 0 (second (first (second week))))})
      [] grouped-by-week)]))
