(ns run-hub.models.log
  (:require [clj-time.core :as time]
            [clj-time.format :as format]))

(defn training-dates
  ([start end] (training-dates start end []))
  ([start end interval]
   (if (time/after? start end)
     interval
     (recur (time/plus start (time/days 1))
            end
            (concat interval [start])))))

(defn formatted-mpw [mileage]
  (format "%.2f" (double mileage)))

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

(defn group-by-week [workouts]
  (into (sorted-map) (group-by #(previous-sunday (:when %)) workouts)))

(defn total-miles [workouts]
  (apply + (map :miles workouts)))

(defn empty-workouts-for-week [start-of-week]
  (apply merge
         (map
          (fn [date]
            {date []})
          (training-dates start-of-week (time/plus start-of-week (time/days 6))))))

(defn complete-week [start-of-week workouts]
  (sort-by first (merge (empty-workouts-for-week start-of-week) (group-by-day workouts))))

