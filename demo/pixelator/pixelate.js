(function(root) {

  function Array2(rows,cols) {
    this.data = new Array(rows*cols)
    this.rows = rows
    this.cols = cols
  }

  Array2.prototype.get = function(row,col) {
    return this.data[row*this.cols+col]
  }

  Array2.prototype.set = function(row,col,val) {
    this.data[row*this.cols+col] = val
  }

  function binaryArray2FromImgData(imgData) {
    var arr = new Array2(imgData.height,imgData.width)
    var d = imgData.data
    for (var i = 0; i < d.length; i += 4) {
      var pxi = i / 4
      var y = pxi / imgData.width
      var x = pxi - y * imgData.width
      var gray = (d[i] + d[i + 1] + d[i + 2]) / 3;      
      var is_fg = gray < 128      
      arr.set(y,x,is_fg)
    }
    return arr
  }

  function PixelWidget(parentNode) {
    this.svg = SVG().addTo(parentNode)
    return this
  }

  PixelWidget.prototype.export = function() {
    return this.svg.svg()
  }

  PixelWidget.prototype.update = function(imgData, opts) {
    opts = opts || {};
    var arr = binaryArray2FromImgData(imgData)
    var px = opts.pixelSize
    var step = opts.step
    var pad = opts.pad || 20
    var font = opts.font || {size: px-4, family:'Helvetica'}    

    this.pixelColorFunc = opts.pixelColorFunc || function(is_fg) {return is_fg ? '#000' : '#fff'}
    this.bitmap = arr        
    this.width = arr.cols * step
    this.height = arr.rows * step    
    this.pixels = new Array2(arr.rows, arr.cols)    
    this.svg.clear().size(this.width + 2 * pad, this.height + 2 * pad) // resize svg

    var thiz = this
    function onPixelClick() {
      var pos = this.data('pos')
      var crnt = thiz.bitmap.get(pos.y,pos.x)
      thiz.bitmap.set(pos.y,pos.x, !crnt)
      this.fill({ color: thiz.pixelColorFunc(!crnt)})
    }

    for (var i = 0 ; i < arr.rows; ++i)
    for (var j = 0 ; j < arr.cols; ++j) {
      var pixel = this.svg.rect(px, px).fill(this.pixelColorFunc(arr.get(i,j))).move(pad + j*step, pad + i*step).data('pos', {x: j, y: i})
      pixel.click(onPixelClick)
      this.pixels.set(i, j, pixel)
    }

    for (var i = 0 ; i <= arr.rows; ++i) {
      this.svg.line(0, pad+i*step, this.width+2*pad, pad+i*step).stroke({ width: 0.5, color: "#000"})
   
    }
    for (var i = 0 ; i < arr.rows; ++i) {
      if (i % 2 == 1) {
        var label = (i+1).toString()
        this.svg.text(label).font(font).move(0,(step-px) + pad + i*step)
        this.svg.text(label).font(font).move(this.width+pad,(step-px) + pad + i*step)
      }
    }

    for (var i = 0 ; i <= arr.cols; ++i) {
      this.svg.line(pad+i*step,0, pad+i*step, this.height+2*pad).stroke({ width: 0.5, color: "#000"})
    }
    for (var i = 0 ; i < arr.cols; ++i) {      
      if (i % 2 == 1) {
        var label = (i+1).toString()
        this.svg.text(label).font(font).move((step-px) + pad + i*step,0)
        this.svg.text(label).font(font).move((step-px) + pad + i*step,this.height+pad)
      }
    }
  }

  PixelWidget.prototype.render = function() {
    for (var i = 0 ; i < this.pixels.rows; ++i)
    for (var j = 0 ; j < this.pixels.cols; ++j) {
      var pixel = this.pixels.get(i,j)
      pixel.fill(this.pixelColorFunc(this.bitmap.get(i,j)))
    }
  }


  function Pixelator(parentNode, cb) {
    this.cb = cb
    var parent = document.querySelector(parentNode);
    this.canvas = document.createElement('canvas');      
    this.canvas.style.display = 'none';
    this.ctx = this.canvas.getContext('2d');
    parent.appendChild(this.canvas);
    return this;
  }


  Pixelator.prototype.update = function(image, opts) {
    opts = opts || {};
    this.image = image;       
    this.outWidth = opts.width || 32
    
    var imageLoaded = function() {
      this.imageUrl = image.src;
      this.width = image.clientWidth;
      this.height = image.clientHeight;   
      this.canvas.width = this.width;
      this.canvas.height = this.height;
      this.image.onload = null;

      this.pixelImage = new Image();
      this.pixelImage.onload = function() {
        this.ready = true;
        this.render();
      }.bind(this);
      this.pixelImage.src = this.imageUrl;
    }.bind(this);

    if (this.image.complete) {
      imageLoaded();
    }

    this.image.onload = imageLoaded;    
  }


  Pixelator.prototype.setOutputWidth = function(width) {
    this.outWidth = width
    this.render()
  }
  
  Pixelator.prototype.render = function() {
    if (!this.ready) return this;
    var w = this.outWidth
    var h = this.outWidth * (this.height / this.width)
    this.ctx.drawImage(this.pixelImage, 0, 0, w, h);
    var imgData = this.ctx.getImageData(0, 0, w, h);    
    this.cb(imgData)    
  };

 root.Pixelator = Pixelator;
 root.PixelWidget = PixelWidget

})(this);
