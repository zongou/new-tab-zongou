import './style.less'

import { canvasRGB } from 'stackblur-canvas'
import shortid from 'shortid'
import classNames from 'classnames'
import React, { Component } from 'react'
import PropTypes from 'prop-types'

import { bindActionCreators } from 'redux'
import { connect } from 'react-redux'
import { saveSettings } from '../../../actions/settings'

import muiThemeable from 'material-ui/styles/muiThemeable'
import Paper from 'material-ui/Paper'
import IconButton from 'material-ui/IconButton'
import { RadioButton, RadioButtonGroup } from 'material-ui/RadioButton'
import Slider from 'material-ui/Slider'
import Toggle from 'material-ui/Toggle'
import Checkbox from 'material-ui/Checkbox'
import SelectField from 'material-ui/SelectField'
import MenuItem from 'material-ui/MenuItem'
import RaisedButton from 'material-ui/RaisedButton'
import TextField from 'material-ui/TextField'
import { List, ListItem } from 'material-ui/List'
import Subheader from 'material-ui/Subheader'
import Dialog from 'material-ui/Dialog'
import FlatButton from 'material-ui/FlatButton'
import Snackbar from 'material-ui/Snackbar'
import LinearProgress from 'material-ui/LinearProgress'
import ActionOpacity from 'material-ui/svg-icons/action/opacity'
import NavigationClose from 'material-ui/svg-icons/navigation/close'
import BlurOn from 'material-ui/svg-icons/image/blur-on'
import BrightnessMedium from 'material-ui/svg-icons/device/brightness-medium'

const styles = {
  inputImage: {
    cursor: 'pointer',
    position: 'absolute',
    top: 0,
    bottom: 0,
    right: 0,
    left: 0,
    width: '100%',
    opacity: 0,
  },
  radio: {
    margin: '24px 0',
  },
  radioLabel: {
    flex: 1
  },
  listItem: {
    paddingLeft: '16px',
    borderBottom: '1px solid rgba(200, 200, 200, 0.3)'
  },
  slider: {
    margin: '0 auto',
    width: 'calc(100% - 12px)'
  },
  sliderIcon: {
    margin: '0 22px 0 -2px'
  },
  dialogContent: {
    width: '380px'
  },
  dialogBody: {
    padding: '16px 0'
  },
  progress: {
    position: 'absolute',
    bottom: '0',
    borderRadius: '0'
  },
  frequencyDialogContent: {
    width: '310px'
  },
  radioLeft: {
    marginBottom: '24px'
  },
}

class Wallpaper extends Component {
  static contextTypes = {
    intl: PropTypes.object.isRequired
  }
  constructor(props) {
    super(props)
    const { backgroundSource, backgroundColor, backgroundShade, updateFrequency } = props.settings
    this.state = {
      source: backgroundSource ? backgroundSource : 1,
      frequency: updateFrequency ? updateFrequency : 0,
      color: backgroundColor,
      shade: backgroundShade ? backgroundShade : 1,
      frequencyDialogOpen: false,
      colorDialogOpen: false,
      snackbarOpen: false,
      snackbarMessage: '',
      fetching: false,
      completed: 0
    }
    this.colorPattern = /^#([A-Fa-f0-9]{6}|[A-Fa-f0-9]{3})$/
    this.spaceSize = 10 * 1024 * 1024
    this.canvasWidth = 570
  }
  componentDidMount() {
    /**
     * Automatically fetch wallpaper base on frequency
     */
    const { darkMode, background, backgroundSource, updateFrequency } = this.props.settings
    const record = window.localStorage.wallpaperUpdateTime * 1
    // check the time format
    if (!/^\d{13}$/.test(record)) return
    // the conditions not met of fetch wallpaper automatically
    if (!record || darkMode || !background || backgroundSource !== 1 || !updateFrequency) return

    const date = new Date()
    const diff = date.getTime() - record
    // console.log(record, diff, new Date(record).getDate(), date.getDate())
    let shouldFetch = false
    switch (updateFrequency) {
      // ten minutes
      case 1:
        if (diff > 600000) shouldFetch = true
        break
      // an hour
      case 2:
        if (diff > 3600000) shouldFetch = true
        break
      // a day
      case 3:
        if (new Date(record).getDate() !== date.getDate()) shouldFetch = true
        break
      default:
        break
    }
    if (shouldFetch) {
      this.fetchWallpaper()
    }
  }
  componentWillReceiveProps(nextProps) {
    // Lazy load
    if (!this.state.load && nextProps.load) {
      this.setState({
        load: true
      })
    }
  }
  useWallpaper = (event, bool) => {
    const { settings, saveSettings } = this.props
    const saved = { background: bool }
    // If user choose using wallpaper in the first time, save the source with internet wallpaper
    if (!settings.backgroundSource) {
      saved.backgroundSource = 1
    }
    saveSettings(saved)
  }
  /**
   * Wallpaper source
   */
  handleSourceChange = (event, index, value) => {
    this.setState({
      source: value
    })
    this.props.saveSettings({
      backgroundSource: value
    })
  }
  fetchFailed() {
    const { intl } = this.context
    this.setState({
      snackbarOpen: true,
      snackbarMessage: intl.formatMessage({ id: 'desktop.msg.fetch.failed' }),
      fetching: false,
      completed: 0
    })
  }
  fetchWallpaper = async event => {
    const { intl } = this.context
    // Block multiple requests
    if (this.state.fetching) {
      this.setState({
        snackbarOpen: true,
        snackbarMessage: intl.formatMessage({ id: 'desktop.msg.fetching' })
      })
      return
    }
    this.setState({
      fetching: true,
      completed: 0
    })
    const { width, height } = window.screen
    // const url = `http://localhost:5300/api/wallpaper/${width}x${height}`
    const url = `https://tab.xiejie.co/api/wallpaper/${width}x${height}`
    try {
      const res = await fetch(url)
      const msg = await res.json()
      // Got the wallpaper's url
      this.setState({ completed: 1 })
      // Get wallpaper via XHR and implement progress
      const data = await new Promise((resolve, reject) => {
        const xhr = new XMLHttpRequest()
        xhr.open('get', msg.result[0].url, true)
        xhr.responseType = 'blob'
        xhr.onload = () => {
          if (xhr.status === 200) {
            setTimeout(() => {
              resolve(xhr.response)
            }, 300)
          } else {
            reject('error')
          }
        }
        xhr.onerror = () => reject('error')
        xhr.onprogress = e => {
          const completed = Math.round(e.loaded / e.total * 100)
          this.setState({ completed: completed < 1 ? 1 : completed })
        }
        xhr.send()
      })
      const { blurRadius } = this.props.settings
      const fr = new FileReader()
      fr.onloadend = () => {
        let callback
        // if fetch a new wallpaper via user click
        if (event) {
          this.originImage = fr.result
          // if use choose blur then save blur wallpaper to temporary and update backgrand-image url
          callback = blurRadius ? () => this.saveBlurImage(blurRadius, () => this.updateBackgroundImageUrl(1)) : this.updateBackgroundImageUrl
        } else {
          // fetch wallpaper automatically
          // just save to temporary
          callback = blurRadius ? () => this.saveBlurImage(blurRadius, undefined, fr.result) : undefined
        }
        this.saveImage(data, callback)
      }
      fr.readAsDataURL(data)
      // Restore status
      this.setState({
        fetching: false
      })
      this.saveUpdateTime()
    } catch (e) {
      this.fetchFailed()
      this.errorHandler(e)
    }
  }
  saveUpdateTime() {
    window.localStorage.setItem('wallpaperUpdateTime', Date.now())
  }
  errorHandler(e) {
    console.error(e)
  }
  base64ToBinary(imgUrl) {
    const BASE64_MARKER = ';base64,'
    const base64Index = imgUrl.indexOf(BASE64_MARKER) + BASE64_MARKER.length
    const base64 = imgUrl.substring(base64Index)
    const raw = window.atob(base64)
    const rawLength = raw.length
    const array = new Uint8Array(new ArrayBuffer(rawLength))

    for (let i = 0; i < rawLength; ++i) {
      array[i] = raw.charCodeAt(i)
    }
    return array
  }
  /**
   * Read image from local disk
   */
  readImage = event => {
    const { intl } = this.context
    const { blurRadius } = this.props.settings
    const file = event.target.files[0]
    const { type, size } = file
    // console.log(type, size)
    if (!/image\/(jpg|jpeg|png|gif)/.test(type)) {
      this.setState({
        snackbarOpen: true,
        snackbarMessage: intl.formatMessage({ id: 'desktop.msg.not.supported' })
      })
      return
    }
    if (size > this.spaceSize) {
      this.setState({
        snackbarOpen: true,
        snackbarMessage: intl.formatMessage({ id: 'desktop.msg.too.large' })
      })
      return
    }

    const fr = new FileReader()
    fr.onloadend = () => {
      this.originImage = fr.result
      const buffer = this.base64ToBinary(this.originImage)
      const { blurRadius } = this.props.settings
      const blob = new Blob([buffer], { type })
      // if blur then save blur image
      // update background-image url
      const callback = blurRadius ? () => this.saveBlurImage(blurRadius, () => this.updateBackgroundImageUrl(1)) : this.updateBackgroundImageUrl
      this.saveImage(blob, callback)
    }
    fr.readAsDataURL(file)
  }
  updateBackgroundImageUrl(blur) {
    document.querySelector('#app').style.backgroundImage = `url(filesystem:chrome-extension://${chrome.app.getDetails().id}/temporary/wallpaper${blur ? '-blur' : ''}.jpg?r=${Date.now()})`
  }
  /**
   * Read the origin image from temporary file system
   */
  readTemporary() {
    return new Promise((resolve, reject) => {
      const errorHandle = e => reject(e)
      window.webkitRequestFileSystem(window.TEMPORARY, this.spaceSize, fs => {
        fs.root.getFile('wallpaper.jpg', { create: false }, fileEntry => {
          fileEntry.file(file => {
            const fr = new FileReader()
            fr.onloadend = () => resolve(fr.result)
            fr.readAsDataURL(file)
          })
        }, errorHandle)
      }, errorHandle)
    })
  }
  applyBlur = async event => {
    const { saveSettings } = this.props
    const radius = document.querySelector('[name=radius]').value * 1
    const saveRadius = () => {
      saveSettings({ blurRadius: radius })
    }
    // if blur radius is 0 then just save radius
    if (!radius) {
      saveRadius()
      return
    }
    if (!this.originImage) {
      try {
        this.originImage = await this.readTemporary()
      } catch (err) {
        this.errorHandler(err)
      }
    }
    this.saveBlurImage(radius, saveRadius)
    
  }
  saveImage(blob, callback) {
    const errorHandler = this.errorHandler
    window.webkitRequestFileSystem(window.TEMPORARY, this.spaceSize, fs => {
      fs.root.getFile('wallpaper.jpg', { create: true }, fileEntry => {
        fileEntry.createWriter(fileWriter => {
          let truncated = false
          fileWriter.onerror = e => console.error(e)
          fileWriter.onwriteend = function () {
            if (!truncated) {
              truncated = true
              this.truncate(this.position)
              return
            }
            if (typeof callback === 'function') {
              callback()
            }
          }
          fileWriter.write(blob)
        }, errorHandler)
      }, errorHandler)
    }, errorHandler)
  }
  saveBlurImage(radius, callback, originImage = this.originImage) {
    const errorHandler = this.errorHandler
    const canvas = document.createElement('canvas')
    const ctx = canvas.getContext('2d')
    const image = new Image()
    image.src = originImage
    image.onload = () => {
      const { width, height } = image
      canvas.width = width
      canvas.height = height
      ctx.drawImage(image, 0, 0, width, height)
      // console.time('blur')
      canvasRGB(canvas, 0, 0, width, height, radius)
      // console.timeEnd('blur')
      canvas.toBlob(blob => {
        window.webkitRequestFileSystem(window.TEMPORARY, this.spaceSize, fs => {
          fs.root.getFile('wallpaper-blur.jpg', { create: true }, fileEntry => {
            fileEntry.createWriter(fileWriter => {
              let truncated = false
              fileWriter.onerror = e => console.error(e)
              fileWriter.onwriteend = function () {
                if (!truncated) {
                  truncated = true
                  this.truncate(this.position)
                  return
                }
                // console.log(Date.now())
                // saveSettings({ blurRadius: radius })
                if (typeof callback === 'function') {
                  callback()
                }
              }
              fileWriter.write(blob)
            }, errorHandler)
          }, errorHandler)
        }, errorHandler)
      }, 'image/jpg')
    }
  }
  /**
   * Download current image
   */
  saveToLocal = async () => {
    try {
      if (!this.originImage) {
        this.originImage = await this.readTemporary()
      }
      const res = await fetch(this.originImage)
      const data = await res.blob()
      const a = document.createElement('a')
      a.href = window.URL.createObjectURL(data)
      a.download = shortid.generate() + '.jpg'
      a.click()
    } catch (err) {
      this.errorHandler(err)
    }
  }
  showFrequencyDialog = () => {
    this.setState({
      frequencyDialogOpen: true
    })
  }
  hideFrequencyDialog = () => {
    this.setState({
      frequencyDialogOpen: false
    })
  }
  handleFrequencyChange = (event, value) => {
    if (value !== this.state.frequency || this.props.settings.updateFrequency === undefined) {
      this.setState({
        frequency: value
      })
      this.props.saveSettings({
        updateFrequency: value
      })
    }
    setTimeout(() => {
      this.hideFrequencyDialog()
    }, 300)
    if (!window.localStorage.wallpaperUpdateTime) {
      this.saveUpdateTime()
    }
  }
  showColorDialog = () => {
    this.setState({
      color: this.props.settings.backgroundColor,
      colorDialogOpen: true
    })
  }
  hideColorDialog = () => {
    this.setState({
      colorDialogOpen: false
    })
  }
  handleColorInput = (e, value) => {
    this.setState({
      color: value
    })

    if (this.colorPattern.test(value)) {
      this.refs.color.value = value
    }
  }
  getColor = e => {
    const value = e.target.value.toUpperCase()
    this.setState({ color: value })
  }
  setBackgroundColor = () => {
    const color = this.state.color.toUpperCase()
    const { saveSettings, settings } = this.props
    this.hideColorDialog()

    if (this.colorPattern.test(color) && color !== settings.backgroundColor) {
      saveSettings({
        backgroundColor: color
      })
    }
  }
  handleShadeChange = (event, value) => {
    this.setState({
      shade: value
    })
    this.props.saveSettings({
      backgroundShade: value
    })
  }
  handleMask = (event, value) => {
    document.querySelector('#mask').style.backgroundColor = `rgba(0, 0, 0, ${value})`
  }
  applyMask = () => {
    const strength = document.querySelector('[name=mask]').value * 1
    this.props.saveSettings({ maskStrength: strength })
  }
  handleTransparency = (event, value) => {
    const transparency = 1 - value
    document.querySelector('.logo').style.opacity = transparency
    document.querySelector('.engine-name').style.opacity = transparency
  }
  applyTransparency = () => {
    const transparency = 1 - document.querySelector('[name=transparency]').value
    this.props.saveSettings({ logoTransparency: transparency })
  }
  render() {
    const { intl } = this.context
    const { settings, saveSettings, muiTheme, closeDrawer } = this.props
    const { source, frequency, color, shade, frequencyDialogOpen, colorDialogOpen, opacity, snackbarOpen, snackbarMessage, fetching, load, completed } = this.state
    const { darkMode, topShadow, background, blurRadius, maskStrength, hideWebsites } = settings

    const colorActions = [
      <FlatButton
        label={intl.formatMessage({ id: 'button.cancel' })}
        primary={true}
        onTouchTap={this.hideColorDialog}
      />,
      <FlatButton
        label={intl.formatMessage({ id: 'button.confirm' })}
        primary={true}
        onTouchTap={this.setBackgroundColor}
      />
    ]
    const frequencyActions = [
      <FlatButton
        label={intl.formatMessage({ id: 'button.cancel' })}
        primary={true}
        onTouchTap={this.hideFrequencyDialog}
      />
    ]

    return (
      <div>
        {load && (
          <div className="wallpaper-settings">
            <Paper className="header-bar" style={{ backgroundColor: muiTheme.palette.primary1Color }} rounded={false} zDepth={1}>
              <div className="tool-bar">
                <div className="bar-left">
                  <div className="bar-label" style={{ color: muiTheme.palette.alternateTextColor }}>{intl.formatMessage({ id: 'desktop.header.title' })}</div>
                </div>
                <div className="bar-right">
                  <IconButton onTouchTap={closeDrawer}>
                    <NavigationClose color={muiTheme.palette.alternateTextColor} />
                  </IconButton>
                </div>
              </div>
            </Paper>
            <section>
              <div className="area">
                <h2 style={{ color: muiTheme.palette.primary1Color }}>{intl.formatMessage({ id: 'desktop.area.title.wallpaper' })}</h2>
                <div className="column">
                  <Checkbox
                    label={intl.formatMessage({ id: 'desktop.top.shadow.label' })}
                    labelPosition="left"
                    defaultChecked={settings.topShadow}
                    onCheck={(event, bool) => saveSettings({ topShadow: bool })}
                    labelStyle={styles.radioLabel}
                  />
                </div>
                <div className="column">
                  <Toggle
                    label={intl.formatMessage({ id: 'desktop.wallpaper.label' })}
                    defaultToggled={settings.background}
                    disabled={darkMode}
                    onToggle={this.useWallpaper}
                  />
                </div>
                <div className="column no-padding-right">
                  <SelectField
                    floatingLabelText={intl.formatMessage({ id: 'wallpaper.source.title' })}
                    value={source}
                    disabled={darkMode || !background}
                    fullWidth={true}
                    underlineStyle={{ display: 'none' }}
                    onChange={this.handleSourceChange}
                  >
                    <MenuItem value={1} primaryText={intl.formatMessage({ id: 'wallpaper.source.internet' })} />
                    <MenuItem value={2} primaryText={intl.formatMessage({ id: 'wallpaper.source.local' })} />
                    <MenuItem value={3} primaryText={intl.formatMessage({ id: 'wallpaper.source.solid' })} />
                  </SelectField>
                </div>
                <div>
                  {source === 1 && (
                    <div>
                      <ListItem
                        primaryText={intl.formatMessage({ id: 'wallpaper.frequency.primary' })}
                        secondaryText={intl.formatMessage({ id: 'wallpaper.frequency.secondary' })}
                        disabled={darkMode || !background}
                        innerDivStyle={styles.listItem}
                        onTouchTap={this.showFrequencyDialog}
                      />
                      <div className="fetch-new">
                        <ListItem
                          primaryText={intl.formatMessage({ id: 'wallpaper.new.primary' })}
                          secondaryText={intl.formatMessage({ id: 'wallpaper.new.secondary' })}
                          disabled={darkMode || !background}
                          innerDivStyle={styles.listItem}
                          onTouchTap={this.fetchWallpaper}
                        />
                        {fetching && (
                          <LinearProgress mode="determinate" value={completed} style={styles.progress} />
                        )}
                      </div>
                      <ListItem
                        primaryText={intl.formatMessage({ id: 'wallpaper.download.primary' })}
                        secondaryText={intl.formatMessage({ id: 'wallpaper.download.secondary' })}
                        disabled={darkMode || !background}
                        innerDivStyle={styles.listItem}
                        onTouchTap={this.saveToLocal}
                      />
                    </div>
                  )}
                  {source === 2 && (
                    <ListItem
                      primaryText={intl.formatMessage({ id: 'wallpaper.local.primary' })}
                      secondaryText={intl.formatMessage({ id: 'wallpaper.local.secondary' })}
                      disabled={darkMode || !background}
                      innerDivStyle={styles.listItem}
                    >
                      <input
                        type="file"
                        disabled={darkMode || !background}
                        style={styles.inputImage}
                        accept="image/png, image/jpeg, image/gif, image/jpg"
                        onChange={this.readImage}
                      />
                    </ListItem>
                  )}
                  {source === 3 && (
                    <ListItem
                      primaryText={intl.formatMessage({ id: 'wallpaper.solid.color.primary' })}
                      secondaryText={intl.formatMessage({ id: 'wallpaper.solid.color.secondary' })}
                      disabled={darkMode || !background}
                      innerDivStyle={styles.listItem}
                      onTouchTap={this.showColorDialog}
                    />
                  )}
                </div>
                {source !== 3 && (
                  <div className="border">
                    <h3 style={{ color: muiTheme.palette.secondaryTextColor }}>{intl.formatMessage({ id: 'wallpaper.blur.primary' })}</h3>
                    <div className="slider-wrap">
                      <BlurOn color={muiTheme.palette.secondaryTextColor} style={styles.sliderIcon} />
                      <Slider
                        disabled={darkMode || !background}
                        value={blurRadius}
                        step={1}
                        min={0}
                        max={100}
                        name="radius"
                        onChange={this.handleBlur}
                        onDragStop={this.applyBlur}
                        sliderStyle={styles.slider}
                      />
                    </div>
                  </div>
                )}
                <div className="border">
                  <h3 style={{ color: muiTheme.palette.secondaryTextColor }}>{intl.formatMessage({ id: 'wallpaper.mask.primary' })}</h3>
                  <div className="slider-wrap">
                    <BrightnessMedium color={muiTheme.palette.secondaryTextColor} style={styles.sliderIcon} />
                    <Slider
                      disabled={darkMode || !background}
                      value={maskStrength}
                      max={0.8}
                      name="mask"
                      onChange={this.handleMask}
                      onDragStop={this.applyMask}
                      sliderStyle={styles.slider}
                    />
                  </div>
                </div>
                <div className="border">
                  <h3 style={{ color: muiTheme.palette.secondaryTextColor }}>{intl.formatMessage({ id: 'wallpaper.shade.primary' })}</h3>
                  <RadioButtonGroup
                    name="shade"
                    defaultSelected={shade}
                    labelPosition="left"
                    onChange={this.handleShadeChange}
                  >
                    <RadioButton
                      value={1}
                      label={intl.formatMessage({ id: 'wallpaper.shade.light' })}
                      disabled={darkMode || !background}
                      style={styles.radio}
                      labelStyle={styles.radioLabel}
                    />
                    <RadioButton
                      value={2}
                      label={intl.formatMessage({ id: 'wallpaper.shade.dark' })}
                      disabled={darkMode || !background}
                      style={styles.radio}
                      labelStyle={styles.radioLabel}
                    />
                  </RadioButtonGroup>
                </div>
              </div>
              <div className="area">
                <h2 style={{ color: muiTheme.palette.primary1Color }}>{intl.formatMessage({ id: 'desktop.area.title.search' })}</h2>
                <div className="column">
                  <Toggle
                    label={intl.formatMessage({ id: 'search.hide.label' })}
                    defaultToggled={settings.hideSearch}
                    onToggle={(event, bool) => saveSettings({ hideSearch: bool })}
                  />
                </div>
                <div className="column">
                  <Checkbox
                    disabled={settings.hideSearch}
                    label={intl.formatMessage({ id: 'search.input.transparency.label' })}
                    labelPosition="left"
                    defaultChecked={settings.transparentSearchInput}
                    onCheck={(event, bool) => saveSettings({ transparentSearchInput: bool })}
                    labelStyle={styles.radioLabel}
                  />
                </div>
                <div className="border">
                  <h3 style={{ color: muiTheme.palette.secondaryTextColor }}>{intl.formatMessage({ id: 'search.logo.transparency.primary' })}</h3>
                  <div className="slider-wrap">
                    <ActionOpacity color={muiTheme.palette.secondaryTextColor} style={styles.sliderIcon} />
                    <Slider
                      disabled={settings.hideSearch}
                      value={1 - settings.logoTransparency}
                      name="transparency"
                      onChange={this.handleTransparency}
                      onDragStop={this.applyTransparency}
                      sliderStyle={styles.slider}
                    />
                  </div>
                </div>
              </div>
              <div className="area">
                <h2 style={{ color: muiTheme.palette.primary1Color }}>{intl.formatMessage({ id: 'desktop.area.title.webistes' })}</h2>
                <div className="column">
                  <Toggle
                    label={intl.formatMessage({ id: 'webistes.hide.label' })}
                    defaultToggled={settings.hideWebsites}
                    onToggle={(event, bool) => saveSettings({ hideWebsites: bool })}
                  />
                </div>
                <div className="column">
                  <Checkbox
                    disabled={darkMode || hideWebsites || !background || settings.backgroundShade !== 2}
                    label={intl.formatMessage({ id: 'webistes.text.shadow.label' })}
                    labelPosition="left"
                    defaultChecked={settings.websiteLabelShadow}
                    onCheck={(event, bool) => saveSettings({ websiteLabelShadow: bool })}
                    labelStyle={styles.radioLabel}
                  />
                </div>
              </div>
            </section>
            <Dialog
              title={intl.formatMessage({ id: 'wallpaper.frequency.dialog.title' })}
              actions={frequencyActions}
              contentStyle={styles.frequencyDialogContent}
              bodyStyle={{ paddingBottom: 0, overflow: 'visible' }}
              onRequestClose={this.hideFrequencyDialog}
              open={frequencyDialogOpen}
            >
              <RadioButtonGroup
                name="hue"
                defaultSelected={frequency}
                onChange={this.handleFrequencyChange}
              >
                <RadioButton
                  value={1}
                  label={intl.formatMessage({ id: 'wallpaper.frequency.minute' })}
                  style={styles.radioLeft}
                />
                <RadioButton
                  value={2}
                  label={intl.formatMessage({ id: 'wallpaper.frequency.hour' })}
                  style={styles.radioLeft}
                />
                <RadioButton
                  value={3}
                  label={intl.formatMessage({ id: 'wallpaper.frequency.day' })}
                  style={styles.radioLeft}
                />
                <RadioButton
                  value={0}
                  label={intl.formatMessage({ id: 'wallpaper.frequency.close' })}
                />
              </RadioButtonGroup>
            </Dialog>
            <Dialog
              open={colorDialogOpen}
              actions={colorActions}
              onRequestClose={this.hideColorDialog}
              contentStyle={styles.dialogContent}
            >
              <div className="color-circle">
                <input type="color" id="color" hidden onInput={this.getColor} value={color} ref="color" onChange={() => {}} />
                <label htmlFor="color" style={{ backgroundColor: color }}></label>
                <TextField
                  floatingLabelText={intl.formatMessage({ id: 'theme.input.placeholder' })}
                  value={color}
                  onChange={this.handleColorInput}
                />
              </div>
            </Dialog>
            <Snackbar
              open={snackbarOpen}
              message={snackbarMessage}
              autoHideDuration={2000}
              onRequestClose={() => this.setState({ snackbarOpen: false })}
            />
          </div>
        )}
      </div>
    )
  }
}

const mapStateToProps = state => {
  const { settings } = state
  return { settings }
}

export default muiThemeable()(connect(mapStateToProps, { saveSettings })(Wallpaper))
