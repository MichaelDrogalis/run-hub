(ns run-hub.views.log
  (:require [hiccup.core :refer :all]
            [hiccup.page :refer :all]
            [clojure.pprint :refer :all]
            [run-hub.models.log :as log]))

(defn render-if [attribute markup]
  (if attribute
    markup))

(defn describe-workout [workout]
  [:div.ten.columns
   [:div.row
    [:div.ten.columns.workout-description.panel.radius
     [:div.row
      [:div.five.columns
       [:div.row
        [:div.eleven.columns.offset-by-one.workout-metric
         (:type workout)]]
       [:div.row
        [:div.five.columns.offset-by-one.workout-metric
         (render-if (:miles workout) (str (:miles workout) " miles"))]
        [:div.five.columns.offset-by-one.workout-metric
         (:duration workout)]]]
      [:div.seven.columns.workout-metric (:notes workout)]]]
    [:div.two.columns]]])

(defn describe-day [day]
  (let [date (first day)
        workouts (second day)]
    [:div.row.training-day
     [:div.two.columns
      [:div.row.day-name
       [:div.twelve.columns
        [:h5 (log/day-name-for date)]]]
      [:div.row
       [:div.twelve.columns.full-date
        (log/format-date date)]]]
     (map describe-workout workouts)]))

(defn describe-week [week]
  (let [workouts (second week)
        complete-week (log/complete-week (first week) (second week))]
    [:div.row
     [:div.twelve.columns
      [:div.row
       [:div.two.columns.mpw
        [:div.label (str (log/formatted-mpw (log/total-miles workouts)) " miles")]]
       [:div.ten.columns]]
      (map describe-day complete-week)]]))

(defn with-common-theme [& mark-up]
  (html
   [:head
    (include-css "/css/foundation.css")
    (include-css "/css/log.css")
    (include-css "/css/general_foundicons.css")
    (include-css "/css/general_foundicons_ie7.css")
    [:title "RunHub: Social training for distance runners"]]
   [:body
    [:div.container mark-up]
    (include-js "http://code.jquery.com/jquery-latest.min.js")
    (include-js "/js/foundation.min.js")
    (include-js "/js/highcharts/highcharts.js")
    (include-js "/js/highcharts/modules/exporting.js")
    (include-js "/js/app.js")
    (include-js "/js/cljs-compiled.js")]))
  
(defn mikes-log [training]
  (with-common-theme
    [:div.row
     [:div.twelve.columns
      [:div#runner-info
       [:h1 "Log of Mike Drogalis"]]
      [:div#week-changer
       [:i#previous-week.general.foundicon-left-arrow]
       [:i#next-week.general.foundicon-right-arrow]]]]
    [:div#training-log.row
     [:div.twelve.columns
      (map describe-week training)]]))

(defn mikes-mpw []
  (with-common-theme
    [:div.row
     [:div.twelve.columns
      [:div#runner-info
       [:h1 "MPW of Mike Drogalis"]]]]
    [:div.row
     [:div.twelve.columns
      [:div#mpw-graph]]]))
    