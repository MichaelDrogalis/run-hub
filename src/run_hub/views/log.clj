(ns run-hub.views.log
  (:require [hiccup.core :refer :all]
            [hiccup.page :refer :all]
            [run-hub.models.log :as log]))

(defn render-if [attribute markup]
  (if attribute
    markup))

(defn workout-description [workout]
  [:div.ten.columns.workout-description
   [:div.row
    [:div.five.columns
     [:div.row
      [:div.five.columns.offset-by-one.workout-metric
       (:type workout)]      
      [:div.five.columns.offset-by-one.workout-metric
       (render-if (:miles workout) (str (:miles workout) " miles"))]]
     [:div.row
      [:div.five.columns.offset-by-one.workout-metric
       (render-if (:pace workout) (str (:pace workout) " min/mile"))]
      [:div.five.columns.offset-by-one.workout-metric
       (:duration workout)]]]
    [:div.seven.columns.workout-metric (:notes workout)]]])

(defn mikes-log [training]
  (html
   [:head
    (include-css "/css/foundation.css")
    (include-css "/css/log.css")]
   [:body
    [:div.container
     [:div.row
      [:div.span12
       [:div#runner-info
        [:h1 "Log of Mike Drogalis"]]]]
     [:div#training-log.row
      [:div.twelve.columns
       (map
        (fn [session]
          [:div.row
           [:div.two.columns
            [:div.row.day-name
             [:div.twelve.columns
              [:h5 (log/day-name-for (:when session))]]]
            [:div.row
             [:div.twelve.columns.full-date
              (log/format-date (:when session))]]]
           (map workout-description (:workouts session))])
        training)]]]
    (include-js "http://code.jquery.com/jquery-latest.min.js")
    (include-js "/js/foundation.min.js")]))

