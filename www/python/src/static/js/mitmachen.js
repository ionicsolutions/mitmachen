// params - type, title, weblink
function trackingUserActivity(type, title, weblink){
    var data = {};
    data['type'] = type;
    data['title'] = title;
    data['weblink'] = weblink;
    $.ajax({
        url: '/tracking',
        type: 'POST',
        contentType: 'application/json',
        dataType: 'json',
        data: JSON.stringify(data),
        success: function(d){
            console.log(d);
        },
        error: function(err){
            console.log(err);
        }
    })
}

$( function() {
    // All displayed text is defined here
    var text = {
        SUGGEST_INTRO: "Wie wäre es mit",
        SUGGEST_OR: "oder",
        PLEASE_WAIT: "Bitte warte einen Moment...",
        NO_RESULTS: "Dazu haben wir leider nichts gefunden. Wie wäre es mit einem anderen Thema?",
        MORE_RESULTS: "Zu diesem Thema gibt's noch mehr...",
        LOAD_MORE: "neue Vorschläge anzeigen",
        "Belege fehlen": "In diesem Artikel fehlen Belege. Recherchiere fehlende Quellen und füge sie ein.",
        "Veraltet": "Teile dieses Artikels sind nicht auf dem neuesten Stand. Recherchiere die Informationen und ergänze den Artikel.",
        "Lückenhaft": "In diesem Artikel fehlen wichtige Informationen. Recherchiere die Informationen und ergänze den Artikel.",
        "Ungeprüfter Link": "In diesem Artikel wurde ein Link automatisch aktualisiert. Prüfe, ob der Link noch stimmt.",
        "Überarbeiten": "In diesem Artikel muss grundlegend etwas verändert werden. Schau nach, was fehlt und überarbeite den Artikel."
    }

    var anchor = {
        "Belege fehlen": "#Vorlage_Belege_fehlen",
        "Veraltet": "#Vorlage_Veraltet",
        "Lückenhaft": "#Vorlage_Lueckenhaft",
        "Ungeprüfter Link": "",
        "Überarbeiten": "#Vorlage_Ueberarbeiten",
        "Allgemeinverständlichkeit": "#Vorlage_Unverstaendlich"
    }

    // https://stackoverflow.com/questions/34704997/jquery-autocomplete-in-flask
    $("#category").autocomplete({
        source:function(request, response) {
            var term = request.term.trim();
            if(term == ""){
                return false;
            }
            $.getJSON($URL_FOR_AUTOCOMPLETE,{
                q: term,
            },
            function(data) {
                response(data.categories);
            });
        },
        minLength: 3,
        select: function(event, ui) {
            $("#category").val(ui.item.value);
            $("#category").change();
        }
    });

    function suggest_topics() {
        $.getJSON($URL_FOR_SUGGEST, {},
            function(result) {
                var suggest = $("#suggested").text(text.SUGGEST_INTRO + " ")
                $.each(result.categories, function(i, value) {
                    $("<span />").addClass("badge")
                        .addClass("badge-secondary").attr("title", value)
                        .attr("id", "suggest-" + value).text(value).appendTo(suggest);
                    if (i < result.categories.length - 2) {
                        suggest.append(" ");
                    } else if ( i == result.categories.length - 2) {
                        suggest.append(" " + text.SUGGEST_OR + " ")
                    }
                });
                suggest.append("?");

                $("span.badge").click(function(event){
                    $("#category").val(event.target.id.replace(/suggest-/, ""));
                    $("#category").change();
                });
        });
    }
    // suggest_topics();

    $("#category").on("change keypress", function(event) {
        // if (event.type == 'change' || (event.type == 'keypress' && event.which == 13)) {
        if (event.type == 'keypress' && event.which == 13) {
            var topic = $("#category").val();
            topic = topic.trim().toLowerCase();
            $("#suggested").empty();

            trackingUserActivity('search', topic, '');

            var articleList = $("#articles");
            articleList.empty();

            if (!topic) {
                suggest_topics();
            } else {
                $("<li/>").addClass("list-group-item")
                    .text(text.PLEASE_WAIT).appendTo(articleList);


                $.getJSON($URL_FOR_FIND, {q: topic}, function(result) {
                    articleList.empty();
                    $.each(result.articles, function(i, doc) {
                        var li = $("<li/>").addClass("list-group-item")
                                           .appendTo(articleList);
                        var div = $("<div/>").appendTo(li);
                        var htitle = $("<h6>").addClass("my-0").appendTo(div);

                        $.getJSON("https://de.wikipedia.org/api/rest_v1/page/summary/".concat(encodeURIComponent(doc.page)),
                        function(result) {
                            $("<a/>").attr("href", "https://de.wikipedia.org/wiki/".concat(encodeURIComponent(doc.page)))
                                     .attr('target', '_blank')
                                     .html(result.displaytitle)
                                     .appendTo(htitle);
                            $("<small/>").addClass("text-muted")
                                         .text(result.description)
                                         .appendTo(div);
                        });

                        $.each(doc.problems, function(i, problem){
                            var a = $("<a/>").attr("href", "https://de.wikipedia.org/wiki/".concat(encodeURIComponent(doc.page)).concat(anchor[problem]))
                                             .appendTo(li);
                            $("<span/>").addClass("badge")
                                        .addClass("badge-warning")
                                        .attr("title", text[problem])
                                        .text(problem)
                                        .appendTo(a);
                            li.append(" ");
                        });
                    });

                    if (result.articles.length == 0) {
                        $("<li/>").addClass("list-group-item")
                                  .text(text.NO_RESULTS)
                                  .appendTo(articleList);
                        suggest_topics();
                    }

                    if (result.more) {
                        var more = $("<li/>").addClass("list-group-item")
                                             .text(text.MORE_RESULTS)
                                             .appendTo(articleList);
                        $("<button />").addClass("btn")
                                       .addClass("btn-secondary")
                                       .attr("type", "button")
                                       .text(text.LOAD_MORE)
                                       .click(function(event) {
                                           $("#category").change();
                                       })
                                       .css("margin-left", "0.5em")
                                       .appendTo(more);
                    }
                });
            }
        }
    });

    if ($("#category").val() != "") {
        console.log('this is running');
        $("#category").change();
    }

    // for tracking
    // trackingUserActivity();
    $('body').on('click', '.slick-slide, .list-box h3 a', function(evt){
        // console.log($(this).attr('class'));
        // console.log(evt.target.tagName);

        var cl = $(this).attr('class');
        var tg = evt.target.tagName;
        // type title weblink
        if(cl === "search-title"){
            var txt = $(this).text();
            var link = $(this).attr('href');
            trackingUserActivity('link', txt, link);
        }else{
            var txt = $(this).text();
            txt.pop();
            txt.pop();
            txt = txt.join(' ');
            trackingUserActivity('category', txt, '');
        }

    })
});
