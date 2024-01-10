/**
 * @category    Vass
 * @package     Vass_Hogar
 */
define([
    'jquery',
    'owlCarousel',
    'owlRows',
    'Magento_Ui/js/modal/modal',
    'contentPagefallen',
], function ($, owlCarousel, rows, modal, contentPagefallen) {
    'use strict';

    var main = {
        init: function (enabled, sessionSVAs, aplicaSVA, direct) {
            var $this = this,
                dp = BASE_URL + 'solicitud/checkout/datospersonales';
            if (enabled && aplicaSVA == 1) {
                $('.redireccion').attr("href", "#");
                $('.redireccion').addClass("btn-save-sva");
                $('.redireccion').attr("data-value", "back");
                $('.page-left-cb').hide();
                $('.svas-container').show();
                $.ajax({
                    url: BASE_URL + 'solicitud/ajax/GetSvas',
                    data: {},
                    type: 'POST',
                    dataType: 'json',
                    //showLoader: true,
                    beforeSend: function () {
                        $("#loadPage").css("display", 'flex');
                    },
                    success: function (resp) {
                        $("#loadPage").css("display", 'none');
                        $('.tabs-filters').empty();
                        if (resp.hasOwnProperty("session") && resp.session == 0) {
                            contentPagefallen.pagErrorSesion();
                            return;
                        }

                        if (resp && resp.status && resp.response && resp.response.totalItems > 0) {
                            $this.render(resp.response, sessionSVAs);
                        } else {
                            if (typeof (dataLayer) !== 'undefined') {
                                dataLayer.push({
                                    event: "validacionMagento",
                                    error: "validacion23",
                                });
                            };
                            //window.location.href = dp;
                            $('.page-left-cb').show();
                            $('.svas-container').hide();
                        }
                    },
                    error: function (xhr, status) {
                        $("#loadPage").css("display", 'none');
                    },
                    complete: function () {
                        $("#loadPage").css("display", 'none');
                    }
                });

                $('.btn-save-sva').on('click', function (event) {
                    var clear = $(this).data('value');
                    event.preventDefault();
                    $this.save(clear);
                })
            } else {
                if (typeof (dataLayer) !== 'undefined') {
                    dataLayer.push({
                        event: "validacionMagento",
                        error: "validacion23",
                    });
                };
                if (direct) {
                    window.location.href = dp;
                }
                $('.page-left-cb').show();
                $('.svas-container').hide();
            }
        },

        render: function (svas, svasession) {
            var container = '.additional-services-container',
                remove_icon = require.toUrl('images/remove_icon.svg'),
                $this = this,
                owlOptions = {
                    loop: false,
                    responsiveClass: true,
                    dots: true,
                    slideBy: 'page',
                    responsive: {
                        0: {
                            items: 1,
                            nav: false,
                            rows: 5,
                        },
                        992: {
                            items: 5,
                            nav: true,
                            rows: 1,
                        },
                    }
                };

            $(container).empty()
            $this.renderSVAs(svas.groups, svasession);
            $('.tabs-filters .btn-tam-text:first').addClass('activee')
            $('.services-list:first').removeClass('no-display')

            rows.init('.owl-services', owlOptions)

            $('.tabs-filters .btn').on("click", function (e) {
                e.preventDefault();
                var target = '#' + $(this).attr('data-target');

                $('.services-list').addClass('no-display');
                $(target).removeClass('no-display');
                $('.tabs-filters .btn').removeClass('activee');
                $(this).addClass('activee');
            });

            $(document).on('click', '.sva-items .btn-sva-remove', function () {
                var row = $(this).closest('.sva-row'),
                    val = row.attr('data-value');

                $('.services-list input:checkbox[value="' + val + '"]').prop('checked', false);
                let precio = $(`#${row[0].id} .price-promo`).text().replace("S/", "");
                $this.subtractSVAs(precio);
                row.remove();
                $this.getAdvice();
            })

            $('.services-list input:checkbox').on('change', function () {
                var item = $(this).closest('.sva-item'),
                    currentServiceID = $(this).attr('id').replace('add-', ''),
                    val = $(this).attr('value'),
                    remember = item.find('.remember').html();

                if ($(this).is(':checked')) {
                    $('.services-list input:checkbox[value="' + val + '"]').prop('checked', true);

                    var htmlVar = `<div id="row_${currentServiceID}" class="sva-row" data-value="${val
                        }">
                        <div class="row py-2 mb-0">
                            <div class="col s8 l9 pr-1">
                                <div class="d-flex align-items-start">
                                    <img class="btn-sva-remove mr-3 pt-2" src="${remove_icon}" alt="X SVA" width="10" height="10">
                                    <strong>
                                        <span class="sva-name">01 ${item.find('.service-title').text()}</span>
                                    </strong>
                                </div>
                                <div id="evaluacion" class="evaluacion d-none"><p><strong></strong></p></div>
                            </div>
                            <div class="col s4 l3 pl-1 text-right"><strong class="price-promo">${item.find('.service-price-promo').text()}</strong></div>
                        </div>
                        `+ $this.getAdvice(remember, svas.creditLimit) + `
                        <hr style="border-top: 1px solid #D3D4D3;" class="my-4">
                    </div>`;
                    $(htmlVar).prependTo(".sva-items");
                    var currentPriceSum = item.find('.service-price-promo').text().replace("S/", "");
                    $this.sumSVAs(svas.creditLimit, currentPriceSum);

                } else {
                    $('.services-list input:checkbox[value="' + val + '"]').prop('checked', false);
                    var currentPrice = item.find('.service-price-promo').text().replace("S/", "");
                    $this.subtractSVAs(currentPrice);
                    $('.sva-row[data-value=' + val + ']').remove();
                }

                $this.formatIds();
            });
        },
        getAdvice: function (text) {
            var cuidado_icon = require.toUrl('images/care_icon.png');
            var advice = '';
            if (text) {
                advice = `<div class="sva-advice mt-3 pb-2">
                    <div class="row">
                        <div class="col pt-1">
                            <img alt="Info" width="18px" src="${cuidado_icon}" />
                        </div>
                        <div class="col s10 l10 pl-0">
                            `+ text + `
                        </div>
                    </div>
                </div>`;
            }
            return advice;
        },
        renderSVAs: function (groups, svasession) {
            var container = '.additional-services-container',
                $this = this,
                html_add = '';
            $.each(groups, function (group, item) {
                html_add = $(`
                <div id="`+ group + `" class="services-list center-align mb-4 owl-carousel owl-theme owl-services no-display">
                ` + $this.renderItems(group, item, svasession) + `
                </div>`);
                html_add.data('item', item)
                $(container).append(html_add)

                $('.tabs-filters').append('<a href="#" data-target="' + group + '" class="btn toggle m-2 btn-tam-text" role="button" data-bs-toggle="button" id="boton' + group + '">' + group + '</a>');
            })
        },

        renderItems: function (group, items, svasession) {
            var html = '';

            function getSVAActive(id) {
                var idActive = false;
                if (Object.keys(svasession).length > 0) {
                    $('#btnAdd').prop('disabled', false);
                    if (svasession[id]) {
                        idActive = true;
                    }
                } else {
                    $('#btnAdd').prop('disabled', true);
                }
                return idActive;
            }
            $.each(items, function (id, item) {
                var isCheck = getSVAActive(item.product_id) ? 'checked' : '';
                var recomended = item.recomended ? '<span class="recomended">Recomendado</span>' : '';
                html += `<div class="` + group + ` sva-item py-4 px-md-3" data-slide-index="` + id + `">
                    <input type="checkbox" `+ isCheck + ` name="item_` + item.product_id + `" id="add-` + group + item.product_id + `" class="d-none" value="` + item.product_id + `">
                    <label class="d-block service-item pt-4 pt-lg-3 pb-4 px-3 pos-rel" for="add-`+ group + item.product_id + `" id="label_` + item.product_id + `">
                        `+ recomended + `
                        <span class="service-title d-none">`+ item.name_producto + `</span>
                        <div class="container-content row d-flex flex-wrap justify-content-between">
                            <div class="mobile-view-left col s8 l12">
                                <div class="img-container mb-2 my-lg-4 py-0 py-lg-4 border-bottom">
                                    <img class="loader-img" alt="`+ item.name_producto + `" src="` + item.image_url + `">
                                </div>
                                <div class="d-flex flex-wrap">
                                    <div data-role="content" class="col s12 p-0 order-1 text-left ppb">
                                    <p class="service-description">`+ item.descripcion_front + `</p>
                                    </div>
                                </div>
                            </div>
                            <div class="mobile-view-right col s4 l12 mt-lg-auto">
                                <div class="center-align">
                                    <p class="center-align service-price-promo">S/`+ parseFloat(parseFloat(item.precio_especial).toFixed(1)).toFixed(2) + `</p>
                                    <p class="service-price-normal">Normal S/`+ parseFloat(parseFloat(item.precio).toFixed(1)).toFixed(2) + `</p>
                                </div>
                            </div>
                            <div class="remember no-display">`+ item.remember + `</div>
                        </div>
                    </label>
                </div>`;
            });
            return html;
        },

        subtractSVAs: function (currentPrice) {
            var special_price = $('.hg-special_price').text().replace("S/", ""),
                regural_price = $('.hg-regular-price').text().replace("S/", "");
            $('.hg-special_price').text('S/' + (parseFloat(special_price) - currentPrice).toFixed(2))
            $('.hg-regular-price').text('S/' + (parseFloat(regural_price) - currentPrice).toFixed(2))
        },

        sumSVAs: function (limit, currentPrice) {
            var special_price = $('.hg-special_price').text().replace("S/", ""),
                regural_price = $('.hg-regular-price').text().replace("S/", "");
            $('.hg-special_price').text('S/' + (parseFloat(special_price) + parseFloat(currentPrice)).toFixed(2))
            $('.hg-regular-price').text('S/' + (parseFloat(regural_price) + parseFloat(currentPrice)).toFixed(2))
            var sum = 0,
                s_price = $('.hg-special_price').data('text'),
                r_price = $('.hg-regular-price').data('text');

            $.each($('.sva-row .price-promo'), function () {
                var price_promo = $(this).text();
                price_promo = price_promo.replace("S/", "");
                sum += parseFloat(price_promo)
            })
            let total = (parseFloat(r_price) + sum).toFixed(2);
            var credlimitha = limit;

            if ((total * 100) > (parseFloat(credlimitha).toFixed(2) * 100)) {
                $("#modalh-errorcont").modal("openModal");
                $('#btnAdd').prop("disabled", true);
            } else {
                $('#btnAdd').prop("disabled", false);
            }
        },

        formatIds: function () {
            var checkboxes = $('.services-list input[type=checkbox]'),
                ids = [];
            $.each(checkboxes, function () {
                if ($(this).is(':checked')) {
                    var cval = $(this).attr('value') ?? '';
                    if (ids && cval) {
                        ids.push(cval);
                    }
                }
            })
            ids = $.uniqueSort(ids.sort());
            this.enableBtn(ids);

            return ids.join(',')
        },

        enableBtn: function (ids) {
            var $this = this;
            if (ids.length > 0) {
                $('#btnAdd').prop('disabled', false)
            } else {
                $('#btnAdd').prop('disabled', true)
            }
        },

        save: function (clear) {
            var ids = this.formatIds();
            $.ajax({
                url: BASE_URL + 'solicitud/ajax/SaveSvas',
                data: {
                    Svas_ids: ids,
                    clear: clear
                },
                type: 'POST',
                dataType: 'json',
                beforeSend: function () {
                    $("#loadPage").css("display", 'flex');
                    $('#btnAdd').prop('disabled', true)
                },
                success: function (resp) {
                    $("#loadPage").css("display", 'none');
                    if (resp.hasOwnProperty("session") && resp.session == 0) {
                        contentPagefallen.pagErrorSesion();
                        return;
                    }
                    if (clear == 'back') {
                        window.location.href = BASE_URL + 'solicitud/checkout/cobertura';
                    } else {
                        if (typeof (dataLayer) !== 'undefined') {
                            dataLayer.push({
                                event: "validacionMagento",
                                error: "validacion23",
                            });
                        };

                        window.location.href = BASE_URL + 'solicitud/checkout/datospersonales';
                    }
                    $('#btnAdd').prop('disabled', false);
                },
                error: function (xhr, status) {
                    $("#loadPage").css("display", 'none');
                    $('#btnAdd').prop('disabled', false)
                },
                complete: function () {
                    $("#loadPage").css("display", 'none');
                }
            });
        }

    }
    return main;

});
