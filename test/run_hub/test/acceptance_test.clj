(ns run-hub.test.acceptance-test
  (:require [midje.sweet :refer :all]
            [clj-time.core :as time]
            [clj-webdriver.taxi :refer :all]
            [run-hub.persistence :as persistence]
            [run-hub.handler :as handler]))

;(set-driver! {:browser :firefox})
;
;(defn local [path]
;  (str "http://localhost:3000" path))
;
;(fact "It finds the page of my log"
;      (to (local "/MikeDrogalis/log"))
;      (text "#runner-info")
;      => "Log of Mike Drogalis")
;
;(defn one-week-snippet []
;  [{:when (time/date-time 2012 8 19) :workouts [{:duration "44:12"
;                                                 :miles 4.74
;                                                 :type "Very Easy"
;                                                 :pace "9:19"}]}
;   {:when (time/date-time 2012 8 20) :workouts [{:duration "58:14"
;                                                 :miles 6.46
;                                                 :type "Easy"
;                                                 :pace "9:00"}
;                                                {:duration "35:00"
;                                                 :miles 3.65
;                                                 :type "Very Easy"
;                                                 :pace "9:35"}]}
;   {:when (time/date-time 2012 8 21) :workouts [{:duration "1:01:45"
;                                                 :miles 6.74
;                                                 :type "Easy"
;                                                 :pace "9:09"}
;                                                {:duration "25:00"
;                                                 :miles 2.63
;                                                 :type "Very Easy"
;                                                 :pace "9:30"}]}
;   {:when (time/date-time 2012 8 22) :workouts [{:duration "1:33:55"
;                                                 :miles 11.93
;                                                 :type "CV Intervals"
;                                                 :notes "9 x 800m, 90s recovery: 3:04, 2:59, 2:59, 3:00, 2:58, 2:59, 2:57, 2:58, 3:00 ; 8 x 30s fast, 60s recovery"}
;                                                {:duration "25:00"
;                                                 :miles 2.54
;                                                 :type "Very Easy"
;                                                 :pace "9:50"}]}
;   {:when (time/date-time 2012 8 23) :workouts [{:duration "59:50"
;                                                 :miles 6.32
;                                                 :type "Very Easy"
;                                                 :pace "9:28"}
;                                                {:duration "42:20"
;                                                 :miles 4.80
;                                                 :type "Very Easy"
;                                                 :pace "8:49"}]}
;   {:when (time/date-time 2012 8 24) :workouts [{:duration "58:36"
;                                                 :miles 6.32
;                                                 :type "Easy"
;                                                 :pace "9:16"}
;                                                {:duration "25:00"
;                                                 :miles 2.63
;                                                 :type "Very Easy"
;                                                 :pace "9:30"}]}
;   {:when (time/date-time 2012 8 25) :workouts [{:duration "1:16:26"
;                                                 :miles 8.33
;                                                 :type "Easy Hills"
;                                                 :pace "9:10"
;                                                 :notes "Valley Forge trails"}]}])
;
;(fact
; "It has the first date of training as August 19, 2012"
; (with-redefs [persistence/mikes-log one-week-snippet]
;   (to (local "/MikeDrogalis/log"))
;   (.contains (text "#training-log") "August 19, 2012"))
; => true)
;
;(quit)

