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
  (map
   (fn [[occurence workouts]]
     {:when occurence
      :workouts workouts})
   (group-by :when training)))

(defn find-in-array-map [array-map key value]
  (if (empty? array-map)
    {}
    (if (not (empty? (filter (fn [[k v]] (and (= k key) (= v value))) (first array-map))))
      (first array-map)
      (recur (rest array-map) key value))))
     
(defn update-in-array-map [array-map key value & extra-vals]
  (if (not (= (find-in-array-map array-map key value) {}))
    (map
     #(if (and (some (into #{} (keys %)) [key])
               (some (into #{} (vals %)) [value]))
        (merge % (apply hash-map extra-vals))
        %)
    array-map)
  (concat array-map [(merge {key value} (apply hash-map extra-vals))])))

(defn compress-training [all-training current-training]
  (let [current-date (:when current-training)
        current-workouts (map #(assoc % :when current-date) (:workouts current-training))
        start-of-week (previous-sunday current-date)
        workouts-this-week (:workouts (find-in-array-map all-training :when start-of-week))]
    (update-in-array-map all-training :when start-of-week :workouts (concat workouts-this-week current-workouts))))

(defn group-by-week [training]
  (let [ordered-training (order-training-by-date training)]
    (reduce compress-training [] ordered-training)))

(defn miles-per-week [training]
  (order-training-by-date  
   (map
    (fn [session]
      {:when (:when session)
       :miles (apply + (map :miles (:workouts session)))
       :days []})
    training)))

