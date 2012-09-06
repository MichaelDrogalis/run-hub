(ns run-hub.persistence
  (require [clj-time.core :as time]
           [run-hub.models.log :as log]))

(defn mikes-log []
  [{:when (time/date-time 2012 8 19)
    :duration "44:12"
    :miles 4.74
    :type "Very Easy"
    :pace "9:19"}
   {:when (time/date-time 2012 8 20)
    :duration "58:14"
    :miles 6.46
    :type "Easy"
    :pace "9:00"}
   {:when (time/date-time 2012 8 20)
    :duration "35:00"
    :miles 3.65
    :type "Very Easy"
    :pace "9:35"}
   {:when(time/date-time 2012 8 22)
    :duration "1:33:55"
    :miles 11.93
    :type "CV Intervals"
    :notes "9 x 800m, 90s recovery: 3:04, 2:59, 2:59, 3:00, 2:58, 2:59, 2:57, 2:58, 3:00 ; 8 x 30s fast, 60s recovery"}
   {:when (time/date-time 2012 8 22)
    :duration "25:00"
    :miles 2.54
    :type "Very Easy"
    :pace "9:50"}
   {:when (time/date-time 2012 8 23)
    :duration "59:50"
    :miles 6.32
    :type "Very Easy"
    :pace "9:28"}
   {:when (time/date-time 2012 8 23)
    :duration "42:20"
    :miles 4.80
    :type "Very Easy"
    :pace "8:49"}
   {:when (time/date-time 2012 8 24)
    :duration "58:36"
    :miles 6.32
    :type "Easy"
    :pace "9:16"}
   {:when (time/date-time 2012 8 24)
    :duration "25:00"
    :miles 2.63
    :type "Very Easy"
    :pace "9:30"}
   {:when (time/date-time 2012 8 25)
    :duration "1:16:26"
    :miles 8.33
    :type "Easy Hills"
    :pace "9:10"
    :notes "Valley Forge trails"}
   {:when (time/date-time 2012 8 26)
    :duration "44:12"
    :miles 4.74
    :type "Very Easy"
    :pace "9:19"}])

