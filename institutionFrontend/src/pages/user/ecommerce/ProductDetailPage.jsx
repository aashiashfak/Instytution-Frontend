import {Stack, useMediaQuery, Container, Button, Grid} from "@mui/material";
import ProductImages from "../../../component/ProductImages/ProductImage";
import {useNavigate, useParams} from "react-router-dom";
import PageNotFoundPage from "../../../component/ErrorPages/PageNotFound";

import {
  getAvailableColorsForSize,
  getDetailsByColorAndSize,
  getImagesBySelectedColor,
  getUniqueColors,
} from "../../../utils/productUtils";
import {useEffect, useState} from "react";
import {useQuery} from "react-query";
import CartLoader from "../../../component/Spinner/CartLoader";
import ProductsServices from "../../../services/user/ProductServices";
import {useDispatch, useSelector} from "react-redux";
import WishlistServices from "../../../services/user/Wishlist";
import {
  addToWishlist,
  removeFromWishlist,
} from "../../../redux/slices/WishlistSlice";
import ProductDetails from "../../../component/Products/ProductMainDetail";
import {style} from "./style";
import useToast from "../../../hooks/useToast";

const ProductDetailPage = () => {
  const isMobile = useMediaQuery((theme) => theme.breakpoints.down("md"));
  const {id} = useParams();
  const styles = style();
  const showToast = useToast();

  const {
    data: product,
    error,
    isLoading,
  } = useQuery(["product", id], () => ProductsServices.getProduct(id), {
    enabled: !!id,
    refetchOnWindowFocus: false,
  });

  const wishlistItems = useSelector((state) => state.wishlist.wishlists);
  const isAuthenticated = useSelector(
    (state) => state.userAuth.isAuthenticated
  );
  const dispatch = useDispatch();
  const navigate = useNavigate();

  const [isWishlisted, setIsWishlisted] = useState(false);
  const [selectedSize, setSelectedSize] = useState("");
  const [selectedColor, setSelectedColor] = useState("");
  const [selectedPrice, setSelectedPrice] = useState("");
  const [selectedStock, setSelectedStock] = useState("");
  const [hasSizes, setHasSizes] = useState(false);
  const [updatedDetails, setUpdatedDetails] = useState(null);
  const [availableColorsForSizeState, setavailableColorsForSizeState] =
    useState(null);

  useEffect(() => {
    if (product) {
      const sizesForProduct = product.details?.some((detail) => detail.size);
      setHasSizes(sizesForProduct);
      if (sizesForProduct) {
        setSelectedSize(product.details[0].size);
      } else {
        setSelectedSize("");
      }
      setSelectedColor(product.details[0].color);
      setSelectedPrice(product.details[0].price);
      setSelectedStock(product.details[0].stock);
    }
  }, [product]);

  // Effect to update details when product, selectedColor, or selectedSize changes
  useEffect(() => {
    if ((product && selectedColor) || selectedSize) {
      const details = getDetailsByColorAndSize(
        product,
        selectedColor,
        selectedSize
      );
      setUpdatedDetails(details);
      if (details) {
        console.log("price and stock is :", details.price, details.stock);
        setSelectedPrice(details.price);
        setSelectedStock(details.stock);
      }

      const availableColorsForSize = product?.details?.some(
        (detail) => detail.size
      )
        ? new Set(getAvailableColorsForSize(product, selectedSize))
        : new Set(getUniqueColors(product?.images));

      if (
        !availableColorsForSize.has(selectedColor) &&
        availableColorsForSize.size > 0
      ) {
        setavailableColorsForSizeState(availableColorsForSize);
        const firstAvailableColor = [...availableColorsForSize][0];
        setSelectedColor(firstAvailableColor);
      } else {
        setavailableColorsForSizeState(availableColorsForSize);
      }
    }
  }, [product, selectedColor, selectedSize]);

  useEffect(() => {
    if (wishlistItems && updatedDetails) {
      const isWishlistedItem = wishlistItems.some(
        (item) => item.product.id === updatedDetails.id
      );
      setIsWishlisted(isWishlistedItem);
    }
  }, [wishlistItems, updatedDetails]);

  if (isLoading) return <CartLoader />;
  if (error || !product) return <PageNotFoundPage />;

  const colorImages = getImagesBySelectedColor(product, selectedColor);

  const handleWishlistToggle = async (e) => {
    e.stopPropagation();
    if (!isAuthenticated) {
      showToast("Login Required", "error");
      navigate("/login", {state: {from: location.pathname}});
      return;
    }

    setIsWishlisted(!isWishlisted);
    showToast(
      isWishlisted ? "Removed from wishlist" : "Added to wishlist",
      "success"
    );

    try {
      if (isWishlisted) {
        const wishlistItem = wishlistItems.find(
          (wishItem) => wishItem.product.id === updatedDetails.id
        );
        if (wishlistItem) {
          await WishlistServices.deleteWishlist(wishlistItem.id);
          dispatch(removeFromWishlist(wishlistItem.id));
        }
      } else {
        const response = await WishlistServices.addWishlist(updatedDetails.id);
        dispatch(addToWishlist(response));
      }
    } catch (err) {
      console.error(err);
      setIsWishlisted(isWishlisted);
      showToast("Failed to update wishlist. Please try again.", "error");
    }
  };

  return (
    <Container maxWidth="lg" sx={styles.container(isMobile)}>
      <Grid container spacing={2}>
        {/* Image Section */}
        <Grid item xs={12} md={6} sx={{borderRight: 1, borderColor: "divider"}}>
          <ProductImages images={colorImages} />
        </Grid>
        {/* Details Section */}
        <ProductDetails
          product={product}
          handleWishlistToggle={handleWishlistToggle}
          isWishlisted={isWishlisted}
          selectedPrice={selectedPrice}
          selectedColor={selectedColor}
          setSelectedColor={setSelectedColor}
          selectedSize={selectedSize}
          setSelectedSize={setSelectedSize}
          hasSizes={hasSizes}
          selectedStock={selectedStock}
          availableColorsForSizeState={availableColorsForSizeState}
        />
        {/* Buttons Section */}
        <Grid item xs={12} md={6}>
          <Stack direction="row" spacing={2} mt={4}>
            <Button
              variant="contained"
              color="primary"
              sx={{
                width: "100%",
                padding: "12px 0",
                fontWeight: "bold",
                backgroundColor: "#ff6f61",
                "&:hover": {
                  backgroundColor: "#ff3d47",
                },
              }}
            >
              ADD TO CART
            </Button>
            <Button
              variant="outlined"
              color="primary"
              sx={{
                width: "100%",
                padding: "12px 0",
                fontWeight: "bold",
                borderColor: "#ff6f61",
                color: "#ff6f61",
                "&:hover": {
                  backgroundColor: "#ff6f61",
                  color: "#fff",
                },
              }}
            >
              BUY NOW
            </Button>
          </Stack>
        </Grid>
      </Grid>
    </Container>
  );
};

export default ProductDetailPage;