const app = {
    products: {
      data: {},
      getAll: function() {
        return this.data;
      },
      getByIds: function(inputArray) {
          let selectedDevices = this.getAll().filter(value => {
              return inputArray.find(val => val === value.id);
          });
          return selectedDevices;
      }        
    }    
};

$.getJSON("data.json", function(jsonData){
    app.products.data = jsonData;
    app.navigation.init();
});

app.navigation = {
    config: {
        pageContainers: $('.pages'),
        previousBtn: $(".previous"),
        nextBtn: $(".next"),
        previousBtnHide: function() {
          return this.previousBtn.hide();
        }
    },
    currentPage: 1,     
    showPage: function() {
        $(".pages").hide();
        $("#page-" + this.currentPage).show();        
    },
    _buttonCond: function() {
        switch (this.currentPage) {
            case 1:
                this.config.previousBtn.hide();
                this.config.nextBtn.show();
            break;          
            case this.numberOfPages:
                this.config.nextBtn.hide();
            break; 
            default:
                this.config.previousBtn.show();
                this.config.nextBtn.show();             
        }
    },
    nextPage: function() {                
        if (this[`page_${this.currentPage}`].condition() === false) {
            return;
        }
        this.currentPage++;
        this._buttonCond();
        this.showPage();
        this[`page_${this.currentPage}`].run();
    },
    previousPage: function() {       
        this.currentPage--;
        this._buttonCond();
        this.showPage();
    },
    _setConfig: function(config){
        this.config.pageContainers = (config && config.pageContainers) || $('.pages');
        this.config.previousBtn = (config && config.previousBtn) ||  $(".previous");
        this.config.nextBtn = (config && config.nextBtn) || $(".next");
    },
    init: function (config) {
        this._setConfig(config);
        this.config.previousBtnHide();
        this.page_1.run();
        this.numberOfPages = this.config.pageContainers.length;
        this.config.nextBtn.on('click', function() {      
            app.navigation.nextPage();
        });
        this.config.previousBtn.on('click', function() {     
            app.navigation.previousPage();
        });
    }
}; //navigation end

app.navigation.page_1 = {
    condition: function() {
        if(+$('.device-output').val() === 0) {
            return false;
        }        
    },
    run: function() {
        $('.click-note').show();
        let deviceText = '</div><div class="row section">';

        $.each(app.products.getAll(), function(key, value){
            deviceText += `
                <div class="col-md-3 device-column" data-id="${value.id}">
                    <div class="card device bg-light">
                        <img class="card-img-top device-img" src="images/${value.image}" alt="${value.alt}">
                        <div class="card-body">
                            <h6 class="card-title text-center">${value.name}</h6>
                            <div class="card-buttons">
                                <button class="btn minus"><i class="fas fa-minus-circle"></i></button>
                                <input type="text" class="input device-quantity" value="0">
                                <button class="btn plus"><i class="fas fa-plus-circle"></i></button>
                            </div>
                        </div>
                    </div>
                </div>`;
        });   
        
        $("#page-1").prepend(deviceText);      

        let device = app.util.calculate(); 
        let count = null;

        $('#page-1 .plus, #page-1 .device-img').on('click', function() {
            let deviceQuantity = $(this).parents('.device-column').find('.device-quantity');
            count =  device.increment(deviceQuantity.val());
            deviceQuantity.val(count);
            app.navigation.page_1.state.add($(this).parents('.device-column').data('id'), count);
            $('.device-output').val(app.navigation.page_1.state.getDeviceOutput());
        });
        $('#page-1 .minus').on('click', function() {
            let deviceQuantity = $(this).parents('.device-column').find('.device-quantity');
            if(+deviceQuantity.val() === 0) {return false;}
            count = device.decrement(deviceQuantity.val());
            deviceQuantity.val(count);
            app.navigation.page_1.state.add($(this).parents('.device-column').data('id'), count);            
            $('.device-output').val(app.navigation.page_1.state.getDeviceOutput());
        });
        $('#page-1 .device-quantity').on('keyup', function() {
            app.navigation.page_1.state.add($(this).parents('.device-column').data('id'), device.onKeyup($(this).val()));          
            $('.device-output').val(app.navigation.page_1.state.getDeviceOutput());
        });
    },
    state: {
        indexAt: 0,
        items: [],
        add: function (itemId, itemCount) {
          if (this.items.some((item, index) => {
              this.indexAt = index;
              return item.id === itemId;
          })) {
              console.log(this.getItems()); // todo: remove console.logs.
              return this.items[this.indexAt]['count'] = itemCount;
          }
          console.log(this.getItems());
          return this.items.push({id: itemId, count: itemCount});
        },        
        getItems: function() {
          return this.items;
        },       
        getSelectedIds: function() {
          let getPositiveCounts = this.items.filter(value => value.count > 0)
                                            .map(val => val.id);
          return getPositiveCounts;
        },
        getDeviceOutput: function() {
            let positiveCountsOutput = this.getItems().map(val => val.count)
                                                      .reduce((acc, val) => +acc + (+val));
            return positiveCountsOutput;                                                                            
        }        
    }
}; //page_1 end

app.navigation.page_2 = {
    condition: function() {
        if($('.device-output').val() !== $('.type-output').val()) {
            alert("The quantity selected doesn't match the quantity of devices on first page.");
            return false;
        }
    },  
    run: function() {
        $('.click-note').show();
        let selectedTypes = app.navigation.page_2.state.getSelectedTypes();
        let typesText = '';
        let indexAt = 0;
        let shopping = 0;
        
        app.products.getByIds(app.navigation.page_1.state.getSelectedIds()).forEach(function(item) {
            typesText += `<div class="type-sections-wrap" data-product="${item.id}"><h4 class="device-name">${item.name}</h4>`;
            item.series.forEach(function(seriesItem) {
                typesText += `<hr><h5 class="type-section">Series: <span>${seriesItem.name}</span></h5><div class="row section">`;
                seriesItem.type.forEach(function(typeItem) {
                    if(selectedTypes.length) {
                        if(selectedTypes.some((value,index) => {
                            indexAt = index;
                            return value.name === item.name && value.type === typeItem.name;
                        })) {
                            shopping = selectedTypes[indexAt]['count'];
                        }
                    }                            
                    typesText += `                  
                        <div class="col-md-4 type-column">
                          <div class="card type-card">
                            <img class="card-img-top type-img" src="../images/${typeItem.image}" alt="Card image">
                            <div class="card-body">
                              <h4 class="card-title">Type <span class="type">${typeItem.name}</span></h4>
                              <h6 class='type-item-price'>Price: $<span class='type-price'>${typeItem.price}</span></h6>
                              <div class="type-card-buttons">
                                  <button class="btn minus"><i class="fas fa-minus-circle"></i></button>
                                  <input type="text" value="${shopping}" class="type-quantity input">
                                  <button class="btn plus"><i class="fas fa-plus-circle"></i></button>
                              </div>
                              <a href="#" class="btn btn-primary float-right type-more">Read More</a>
                            </div>
                          </div>                      
                        </div>`;
                    shopping = 0;
                });
                typesText += '</div>';
            });
            typesText += '</div>';
        });        

        $(".page-2-types").html(typesText);

        let type = app.util.calculate();
        let count = null;         

        $('#page-2 .plus, #page-2 .type-img').on('click', function() {
            let typeQuantity = $(this).parents('.type-column').find('.type-quantity');
            count = type.increment(typeQuantity.val());
            typeQuantity.val(count);
            let deviceId = $(this).parents('.type-sections-wrap').data("product");
            let product = $(this).parents('.type-sections-wrap').find('.device-name').html();
            let typeName = $(this).parents('.type-column').find('.type').html();
            let price = $(this).parents('.type-column').find('.type-price').html();            
            app.navigation.page_2.state.add(deviceId, product, typeName, price, count);
            $('.type-output').val(app.navigation.page_2.state.getTypeOutput());            
        });
        $('#page-2 .minus').on('click', function() {
            let typeQuantity = $(this).parents('.type-column').find('.type-quantity');
            if(+typeQuantity.val() === 0) {return false;}            
            count = type.decrement(typeQuantity.val());
            typeQuantity.val(count);
            let deviceId = $(this).parents('.type-sections-wrap').data("product");
            let product = $(this).parents('.type-sections-wrap').find('.device-name').html();
            let typeName = $(this).parents('.type-column').find('.type').html();
            let price = $(this).parents('.type-column').find('.type-price').html();
            app.navigation.page_2.state.add(deviceId, product, typeName, price, count);            
            $('.type-output').val(app.navigation.page_2.state.getTypeOutput());            
        });
        $('#page-2 .type-quantity').on('keyup', function() {
            let deviceId = $(this).parents('.type-sections-wrap').data("product");
            let product = $(this).parents('.type-sections-wrap').find('.device-name').html();
            let typeName = $(this).parents('.type-column').find('.type').html();
            let price = $(this).parents('.type-column').find('.type-price').html();
            app.navigation.page_2.state.add(deviceId, product, typeName, price, type.onKeyup($(this).val()));
            $('.type-output').val(app.navigation.page_2.state.getTypeOutput());            
        });                
    },
    state: {
        indexAt: 0,
        items: [],
        add: function (deviceId, product, typeName, price, count) {          
          if (this.items.some((item, index) => {
              this.indexAt = index;
              return item.id === deviceId && item.type === typeName;
          })) {
              console.log(this.getItems()); // todo: remove console.logs.
              return this.items[this.indexAt]['count'] = count;
          }        
            console.log(this.getItems());
            return this.items.push({id: deviceId, name: product, type: typeName, price: price, count: count});
        },
        getItems: function () {
          return this.items;
        },
        getSelectedTypes: function() {
          let getPositiveCounts = this.items.filter(value => value.count > 0);                                            
          return getPositiveCounts;
        },
        getTypeOutput: function() {
            let positiveCountsOutput = this.getItems().map(val => val.count)
                                                      .reduce((acc, val) => +acc + (+val));
            return positiveCountsOutput;                                                                            
        } 
    }
}; //page_2 end

app.navigation.page_3 =  {
    condition: function () {
        return true;
    },    
    run: function() {
      let selectedTypes = app.navigation.page_2.state.getSelectedTypes();
      let totalQuantity = null;
      let totalExpense = 0;
      let outputText = '';    

      $('.click-note').hide();
    
      for(let typeItem in selectedTypes) {
          outputText += `
            <tr>
              <td>${selectedTypes[typeItem]['name']}</td>
              <td>${selectedTypes[typeItem]['type']}</td>
              <td class="price">${selectedTypes[typeItem]['price']}</td>
              <td class="ordered-quantity">${selectedTypes[typeItem]['count']}</td>            
            </tr>`;          
      }

      $(".output-table-body").html(outputText);
      totalQuantity = app.util.sum('.ordered-quantity');

      $('.ordered-quantity').each(function() {
          totalExpense += parseFloat($(this).html()) * parseFloat($(this).siblings(".price").html());
      });

      $('.total-quantity').html(totalQuantity);
      $('.total-expense').html(totalExpense);             

      let outputImage = '';
      if(totalQuantity <= 4) {        
          outputImage = '<img class="product" src="../images/g3-4ch.jpg" alt="connection">';
      } else if (totalQuantity <= 8) {
          outputImage = '<img class="product" src="../images/g3-8ch.jpg" alt="connection">';
      } else if (totalQuantity <= 12) {
          outputImage = '<img class="product" src="../images/g3-12ch.jpg" alt="connection">';
      } else if (totalQuantity <= 16) {
          outputImage = '<img class="product" src="../images/g3-16ch.jpg" alt="connection">';
      } else {
          outputImage = '<h2 class="output-message text-center">Please contact us as it is a big system.</h2>';
      }

      $('.output-image').html(outputImage);

      $(".print-button").on('click', function() {
          app.util.printPage();        
      });

      $(".save-button").on('click', function() {
          app.util.generatePdf(totalQuantity, totalExpense, selectedTypes, app.util.imgTobase64()).save('order.pdf');
      });

      $(".mail-button").on('click', function() {
          let clientEmail = prompt('Please give us your email address so we could send your order to you','');
          let emailReg = /^(([^<>()\[\]\.,;:\s@\"]+(\.[^<>()\[\]\.,;:\s@\"]+)*)|(\".+\"))@(([^<>()[\]\.,;:\s@\"]+\.)+[^<>()[\]\.,;:\s@\"]{2,})$/i;            
          if(emailReg.test(clientEmail)) {
              $.ajax({
                  method: "POST",
                  url: "phpscript.php",
                  data: {email: clientEmail, pdf: app.util.generatePdf(totalQuantity, totalExpense, selectedTypes, app.util.imgTobase64()).output('datauristring')},             
                  success: function() {
                      alert("We sent your order to " + clientEmail + " web address");
                  }           
              });
          } else {
              alert("It was not a valid email");
          }
      });
    }
}; //page_3 end

app.navigation.page_4 = {        
    run: function() {
        return;
    }    
}

app.util = {    
    calculate: function() {
        let counter = 0;
        return {
          increment: function(value) {
              return counter = +value + 1;
          },
          decrement: function(value) {
              return counter = +value - 1;
          },
          onKeyup: function(value) {
              return counter = +value;
          }
        };
    },    
    sum: function(num, output = 0) {
        $(num).each(function() {
            output += parseFloat($(this).html());
        }); 
        return output;
    },
    printPage: function() {
        window.print();
    },
    generatePdf: function(quantity, expense, rows, base64) {
        let columns = [
            {title: "Product", dataKey: "name"},
            {title: "Type Name", dataKey: "type"}, 
            {title: "Total", dataKey: "count"},    
            {title: "Price", dataKey: "price"}    
        ];
        let tableTop = 1;

        let doc = new jsPDF('p', 'cm');

        if(base64) {
            doc.addImage(base64, 'JPEG', 4, 1, 13, 12);
            tableTop = 14;
        }

        doc.autoTable(columns, rows, {
            styles: {
                lineWidth: 0.04                 
            },
            startY: tableTop,               
            theme: 'grid'              
        });
        doc.text(`Ordered Devices \nQuantity: ${quantity} \nPrice: $${expense}`, 15, doc.autoTable.previous.finalY + 1);

        return doc;
    },
    imgTobase64: function() {
        if(document.getElementsByClassName("product")[0]) {
          let canvas = document.createElement('canvas');
          let ctx = canvas.getContext("2d");
          let img = document.getElementsByClassName("product")[0];
          let imageWidth = img.offsetWidth;
          let imageHeight = img.offsetHeight;
          canvas.width = imageWidth;
          canvas.height = imageHeight;
          ctx.drawImage(img, 0, 0);
          let img1 = new Image();
          img1.src = canvas.toDataURL('image/jpeg', 1.0);
          return img1;
        }
    }
};