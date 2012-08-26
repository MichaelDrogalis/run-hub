(ns run-hub.views.log
  (:require [hiccup.core :refer :all]
            [hiccup.page :refer :all]
            [run-hub.models.log :as log]))

(defn mikes-log []
  (html
   [:head
    (include-css "/css/bootstrap.css")
    (include-css "/css/log.css")]
   [:body
    [:div.container
     [:div.row
      [:div.span12
       [:div#runner-info
        [:h1 "Log of Mike Drogalis"]]]]
     [:div#training-log
      (map
       (fn [date]
         [:div.row
          [:div.span12
           (log/format-date date)]])
       (log/training-dates))]]
    (include-js "http://code.jquery.com/jquery-latest.min.js")
    (include-js "/js/bootstrap.js")]))

