(ns run-hub.views.log
  (:require [hiccup.core :refer :all]
            [hiccup.page :refer :all]
            [run-hub.models.log :as log]))

(defn mikes-log [training]
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
       (fn [session]
         [:div.row
          [:div.span2
           [:div.row.day-name
            [:div.span2
             [:h3 (log/day-name-for (:when session))]]]
           [:div.row.full-date.
            [:div.span2
             (log/format-date (:when session))]]]])
       training)]]
    (include-js "http://code.jquery.com/jquery-latest.min.js")
    (include-js "/js/bootstrap.js")]))

