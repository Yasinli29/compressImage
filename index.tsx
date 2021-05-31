interface ICompressor {
  file: File;
  options: Partial<IOption>;
  getChangedImageTag: () => Promise<HTMLImageElement>;
  getChangedBase64: () => Promise<string>;
  getChangedFile: () => Promise<File>;
  getImageTag: () => Promise<HTMLImageElement>;
  getBase64: () => Promise<string>;
}

interface IOption {
  width: number;
  height: number;
  scale: number;
  quality: number;
  fileType: string;
}

export default class implements ICompressor {
  file: File;
  options: Partial<IOption>;
  constructor(file: File, options: Partial<IOption> = {}) {
    this.file = file
    this.options = options
  }

  private async getDrewCanvas() {
    const imageTag = await this.getImageTag()
    const { width, height } = imageTag
    const {
      scale = 1,
      width: targetWidth = width * scale,
      height: targetHeight = height * scale
    } = this.options

    const oCanvas = document.createElement('canvas')
    const ctx = oCanvas.getContext('2d')!

    oCanvas.width = targetWidth
    oCanvas.height = targetHeight

    ctx.clearRect(0, 0, targetWidth, targetHeight)
    ctx.drawImage(imageTag, 0, 0, targetWidth, targetHeight)
    return oCanvas
  }

  getChangedImageTag() {
    return new Promise<HTMLImageElement>(async (resolve, reject) => {
      const newImage = new Image()
      newImage.onload = () => resolve(newImage)
      newImage.onerror = err => reject(err)
      newImage.src = await this.getChangedBase64()
    })
  }

  async getChangedBase64() {
    const {
      fileType = this.file.type,
      quality
    } = this.options
    const oCanvas = await this.getDrewCanvas()
    return oCanvas.toDataURL(fileType, quality)
  }

  getChangedFile() {
    return new Promise<File>(async (resolve) => {
      const {
        fileType = this.file.type,
        quality
      } = this.options

      const oCanvas = await this.getDrewCanvas()

      oCanvas.toBlob((blob) => {
        resolve(new File([blob!], this.file.name, {
          type: blob!.type
        }))
      }, fileType, quality)
    })
  }

  getImageTag() {
    return new Promise<HTMLImageElement>(async (resolve, reject) => {
      const newImage = new Image()
      newImage.onload = () => resolve(newImage)
      newImage.onerror = err => reject(err)
      newImage.src = await this.getBase64()
    })
  }

  getBase64() {
    return new Promise<string>((resolve, reject) => {
      const reader = new FileReader()
      reader.onload = (e: ProgressEvent<FileReader>) => {
        resolve(e.target!.result as string)
      }
      reader.onerror = err => reject(err)
      reader.readAsDataURL(this.file)
    })
  }
}
