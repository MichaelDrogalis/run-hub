(ns run-hub.persistence
  (require [clj-time.core :as time]
           [run-hub.models.log :as log]
           [cheshire.core :as json]))

(defn mikes-log []
  (log/order-training-by-date
   (map
    (fn [workout]
      (assoc
          (assoc workout :when (log/parse-date (:when workout)))
        :miles
        (try (Double/parseDouble (:miles workout))
             (catch NumberFormatException e 0))))
    (:workouts (json/parse-string (slurp "http://www.se.rit.edu/~mjd3089/log.json") true)))))

